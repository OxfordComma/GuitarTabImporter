'use server'
import { auth } from "@/lib/auth"; // Your Better Auth instance
import SpotifyWebApi from 'spotify-web-api-node';
import { headers } from "next/headers";

export const getSpotifyClient = async () => {
    const account = await auth.api.getAccessToken({
        body: { providerId: "spotify" },
        headers: await headers()
    });

    const client = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    });
    client.setAccessToken(account.accessToken);
    client.setRefreshToken(account.refreshToken);
    return client;
};