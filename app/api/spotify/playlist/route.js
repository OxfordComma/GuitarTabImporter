import { getSpotifyClient} from "@/lib/spotifyclient";
import { clean} from "@/lib/spotify";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get('id');

    if (!playlistId) return Response.json({ error: "Missing ID" }, { status: 400 });

    const spotify = await getSpotifyClient(); // Using the helper from before
    
    let currentTracks = [];
    let offset = 0;
    let total = 1;

    try {
        // Loop until we have fetched every track in the playlist
        while (currentTracks.length < total) {
            const res = await spotify.getPlaylistTracks(playlistId, { offset, limit: 100 });
            currentTracks.push(...res.body.items);
            total = res.body.total;
            offset += 100;
        }

        // Return simplified data for the client to use
        return Response.json({
            // Full track data for 'Remove' logic
            allTracks: currentTracks.map(t => ({
                uri: t.track.uri,
                title: clean(`${t.track.artists[0].name} ${t.track.name}`)
            })),
            // Easy-access sets for 'Add' logic
            currentUris: currentTracks.map(t => t.track.uri),
            currentTitles: currentTracks.map(t => clean(`${t.track.artists[0].name} ${t.track.name}`))
        });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

// Create new playlist
export async function POST(request, { params }) {   
    const body = await request.json()

    const {
        name, description=""
    } = body;

    const spotify = await getSpotifyClient(); // Using the helper from before

    let playlist = await spotify.createPlaylist(`[TABR] ${name}`, { description, public: false })

    return Response.json( playlist )
}