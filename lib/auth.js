import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import client from "./db.js"; // your mongodb client

const db = client.db();

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL, 
	socialProviders: {
		google: { 
			clientId: process.env.NEXT_PUBLIC_AUTH_GOOGLE_CLIENT_ID, 
			clientSecret: process.env.AUTH_GOOGLE_SECRET,
			scope: ["https://www.googleapis.com/auth/drive.file"],
			accessType: "offline", 
			prompt: "consent", 
		}, 
	   spotify: { 
			clientId: process.env.SPOTIFY_CLIENT_ID, 
			clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
			scope: ["user-read-email", "playlist-modify-private"]
		}, 
	},
	database: mongodbAdapter(db, {
		client
	}),
	account: {
        accountLinking: {
            enabled: true,
            // Optional: require the email to be verified on the provider side
            trustedProviders: ["google", "spotify"] 
        }
    },
	// experimental: { joins: true }
});