import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import client from "./db.js"; // your mongodb client

const db = client.db();

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL, 
    socialProviders: {
        google: { 
            clientId: process.env.AUTH_GOOGLE_ID, 
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            scope: ["https://www.googleapis.com/auth/drive.file"],
            accessType: "offline", 
            prompt: "consent", 
        }, 
    },
    database: mongodbAdapter(db, {
        client
    }),
    // experimental: { joins: true }
});