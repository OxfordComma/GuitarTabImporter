import { getSpotifyClient } from "@/lib/spotifyclient";

export async function PUT(request) {
    const { playlistId, toBeAdded, toBeRemoved } = await request.json();
    const spotify = await getSpotifyClient(); // Using the helper from before

    // Batch Add (100 at a time)
    if (toBeAdded?.length) {
        for (let i = 0; i < toBeAdded.length; i += 100) {
            await spotify.addTracksToPlaylist(playlistId, toBeAdded.slice(i, i + 100));
        }
    }

    // Batch Remove
    if (toBeRemoved?.length) {
        for (let i = 0; i < toBeRemoved.length; i += 100) {
            await spotify.removeTracksFromPlaylist(playlistId, toBeRemoved.slice(i, i + 100).map(u => ({ uri: u })));
        }
    }

    return Response.json({ success: true });
}