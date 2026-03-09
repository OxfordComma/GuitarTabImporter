export const clean = (str) => {
    return str
        ?.toLowerCase()
        // 0. Fix non-English characters
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        // 1. Remove everything after a dash (Remasters, Years, etc.)
        .replace(/-.*$/, '') 
        // 2. Remove specific Spotify suffixes that often follow a dash or parens
        .replace(/\b(remaster(ed)?|live|version|studio|mono|stereo|anniversary)\b.*$/g, '')
        // 3. Remove common text in parentheses/brackets
        .replace(/\(.*\)/g, '')
        .replace(/\[.*\]/g, '')
        // 4. Standard cleanup
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, ' ')
        .trim() || '';
};

export async function syncToSpotify(tabs, playlistId, setStatus) {
    const CONCURRENCY_LIMIT = 10; 
    const fullCount = tabs.length;

    // 1. Initial Setup
    setStatus({ current: 0, total: tabs.length, label: 'Initializing...' });

    // 2. Fetch current playlist state to avoid re-adding
    const { allTracks, currentUris, currentTitles } = await fetch(`/api/spotify/playlist?id=${playlistId}`).then(r => r.json());
    
    const tabTitles = tabs.map(t => clean(`${t.artistName} ${t.songName}`));
    const toSearch = tabs.filter(t => !currentTitles.includes(clean(`${t.artistName} ${t.songName}`)));
    const alreadySyncedCount = fullCount - toSearch.length;
    const toBeAdded = [];

    setStatus({ current: alreadySyncedCount, total: fullCount, label: `Found ${alreadySyncedCount} existing songs...` });
    await new Promise(resolve => setTimeout(resolve, 100));

    // 3. Parallel Batch Processing
    for (let i = 0; i < toSearch.length; i += CONCURRENCY_LIMIT) {
        const batch = toSearch.slice(i, i + CONCURRENCY_LIMIT);
        
        setStatus(s => ({ 
            ...s, 
            current: alreadySyncedCount + i, 
            label: `Fetching page ${Math.floor(i/CONCURRENCY_LIMIT) + 1}...` 
        }));

        // Fire off multiple requests simultaneously
        const results = await Promise.all(
            batch.map(tab => 
                fetch(`/api/spotify/search?q=${encodeURIComponent(tab.songName)}&artist=${encodeURIComponent(tab.artistName)}`)
                    .then(res => res.json())
                    .catch(() => ({ uri: null }))
            )
        );

        // Collect successful URIs
        const batchUris = results.map(r => r.uri).filter(uri => uri && !currentUris.includes(uri));
        toBeAdded.push(...batchUris);
    }

    // console.log('to be added:', toBeAdded)
    
    // Identify tracks on Spotify whose "cleaned" title isn't in our new tab list
    console.log('tabTitles:', tabTitles)
    const toBeRemoved = allTracks
        .filter(spotifyTrack => {
            if (!tabTitles.includes( clean( spotifyTrack.title ) || tabTitles.some(t => clean(spotifyTrack.title).includes(t))) ) {
                console.log('Track to be removed:', clean(spotifyTrack.title), tabTitles)
            }
            return !tabTitles.includes( clean( spotifyTrack.title ) || tabTitles.some(t => clean(spotifyTrack.title).includes(t)) )
        })
        .map(spotifyTrack => spotifyTrack.uri);

    // console.log('to be removed:', toBeRemoved)

    // 4. Final Sync (Bulk Add/Remove)
    setStatus(s => ({ ...s, current: fullCount, label: 'Finalizing playlist on Spotify...' }));
    const syncResponse = await fetch('/api/spotify/sync', {
        method: 'PUT',
        body: JSON.stringify({ 
            playlistId, 
            toBeAdded, 
            toBeRemoved, 
        })
    });

    if (!syncResponse.ok) throw new Error('Failed to update playlist');
    
    setStatus({ label: 'Sync Complete!', current: fullCount, total: fullCount });
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStatus({ label: '', current: 0, total: 0 });

};
