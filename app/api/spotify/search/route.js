import client from "@/lib/db"; // Your MongoDB client

import { getSpotifyClient} from "@/lib/spotifyclient";
import { clean} from "@/lib/spotify";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const trackName = searchParams.get('q');
    const artistName = searchParams.get('artist');

    const db = client.db();
    const cacheCollection = db.collection("track_cache");
    
    // 1. Generate a unique cache key
    const cacheKey = `${clean(artistName)}-${clean(trackName)}`;

    // 2. Check Cache First
    const cachedRecord = await cacheCollection.findOne({ _id: cacheKey });
    if (cachedRecord) {
        return Response.json({ uri: cachedRecord.uri, source: 'cache' });
    }
    
    const spotify = await getSpotifyClient();
    
    // Try searching with "studio" first to avoid 13-minute live versions
    let res = await spotify.searchTracks(`track:"${trackName}" artist:"${artistName}"`, { limit: 5 });
    
    let tracks = res.body.tracks.items;
    
    // Filter out Live tracks if the user didn't specifically ask for them
    let track = tracks.find(t => !t.name.toLowerCase().includes('live')) || tracks[0];

    if (track) {
        // Verify the artist matches before returning
        const isArtistMatch = clean(track.artists[0].name).includes(clean(artistName));
        if (isArtistMatch) {
            await cacheCollection.updateOne(
                { _id: cacheKey },
                { $set: { uri: track.uri, name: track.name, artist: track.artists[0].name, updatedAt: new Date() } },
                { upsert: true }
            );

            return Response.json({ uri: track.uri });
        }
        else {
            console.log(`No match found for ${cacheKey}. Closest track: ${track.name} - ${track.artists[0].name}`)
        }
    }
    else {
        console.log(`No track found for ${cacheKey}`)
    }

    return Response.json({ uri: null });
}