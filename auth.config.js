import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Spotify from "next-auth/providers/spotify"

// import { MongoDBAdapter } from "@auth/mongodb-adapter"
// import client from "./lib/db"
 

// const { handlers, signIn, signOut, auth } = NextAuth({
export default {
  // adapter: MongoDBAdapter(client),
  // strategy: "jwt",
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline", 
          response_type: "code",
          scope: 'openid email profile https://www.googleapis.com/auth/drive.file'
          // scope: 'openid email profile https://www.googleapis.com/auth/drive'
        },
      },
    }),
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: `https://accounts.spotify.com/authorize?scope=${encodeURIComponent('playlist-modify-public playlist-modify-private')}`,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    session(params) {
      // console.log('session params', params)
      const {session, token, user, newSession} = params
      // console.log('session objects', {
      //   session,
      //   user,
      //   newSession
      //   token
      // })
      // console.log(`Auth Sess = ${JSON.stringify(session)}`)
      // console.log(`Auth Tok = ${JSON.stringify(token)}`)
      if (token && token.sub) {
          session.user_id = token.sub 
          // session.access_token = token.access_token// Put the provider's access token in the session so that we can access it client-side and server-side with `auth()`
          session.api_key = process.env.AUTH_GOOGLE_API_KEY
          session.client_id = process.env.AUTH_GOOGLE_ID
          session.client_secret = process.env.AUTH_GOOGLE_SECRET
      }
      return session
    },
     jwt(params) {
      // console.log('jwt params', params)
      const {token, session, account} = params
      // console.log('jwt objects', {
      //   token,
      //   session,
      //   account,
      // })
        // console.log(`Auth JWT Tok = ${JSON.stringify(token)}`)
        // console.log(`Router Auth JWT account = ${JSON.stringify(account)}`)
        if (account) {
            token.access_token = account.access_token // Store the provider's access token in the token so that we can put it in the session in the session callback above
            token.refresh_token = account.refresh_token
        }

        return token
    },
  }
}
