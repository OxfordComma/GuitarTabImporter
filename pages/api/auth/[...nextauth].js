import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google";

import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import clientPromise from "../../../lib/mongodb.js"

const GOOGLE_AUTHORIZATION_URL =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    prompt: "consent",
    access_type: "offline",
    response_type: "code",
  })

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token) {
  try {
    const url =
      "https://oauth2.googleapis.com/token?" +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      })

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    }
  } catch (error) {
    console.log(error)

    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}



export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      authorization: {
        params: {
          scope: 'openid email https://www.googleapis.com/auth/drive.file',
          // prompt: "consent",
          access_type: "offline",
          // response_type: "code"
        }
      },
      // async profile(profile) {
      //   console.log('profile:', Object.keys(profile))
      //   return profile
      // }

    }),
  ],
  // callbacks: {
  //   signIn({user, account, profile}) {
  //     // console.log('signIn:', account)

  //     // let mongoClient = await clientPromise
  //     // let db = await mongoClient.db('spotiflow')
  //     // let cl = await db.collection('guitartabimporter')
  //     // let user = await cl.findOne({ email: profile.email })
  //     // let data = await cl.updateOne({ 
  //     //   email: profile.email 
  //     // }, {
  //     //   '$set':{ 
  //     //     // playlists: user.playlists,
  //     //     // sources: user.sources,
  //     //     access_token: account.access_token,
  //     //     refresh_token: account.refresh_token
  //     //   }
  //     // }, { upsert: true })

  //     return true
  //   },
  //   // redirect({ url, baseUrl }) {
  //   //   // console.log('redirect:', url)
  //   //   return url.startsWith(baseUrl) ? url : baseUrl
  //   // },
    // jwt({ token, user, account, profile, isNewUser }) {
    // jwt(props) {
    //   console.log('jwt:', props)
    //   // console.log('token', token)
    //   // return token
    //   // return {
    //     // ...token,
    //     // ...user
    //   // }
    // },
    // session(s, t, u) {
    //   console.log('s:', s)
    //   console.log('t:', t)
    //   console.log('u:', u)
    //   // console.log('session callback:', session)
    //   // console.log('user:', user)
    //   // console.log(token)
    //   // session.id = user.id
    //   // session.sources = user.sources
    //   return {
    //     ...session,
    //   //   ...token
    //   }
    // },
  // },
  session: {
    strategy: 'database',
  },
  adapter: MongoDBAdapter(clientPromise),

})