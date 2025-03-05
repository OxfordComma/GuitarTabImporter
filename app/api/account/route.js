import clientPromise from "lib/db.js"
import { ObjectId } from 'mongodb'
// import { getSession } from "next-auth/react"
import { auth } from 'auth'
import { headers } from "next/headers"
var SpotifyWebApi = require('spotify-web-api-node');

export async function GET(request, { params }) {
	// console.log('GET', {
	// 	request,
	// 	// params
	// })
	let session = await auth()
	// const session = await fetch(process.env.NEXTAUTH_URL + '/api/auth/session').then(r => r.json())
	const searchParams = request.nextUrl.searchParams
	// console.log('account session:', session, searchParams.get('spotify'))
	let provider = 'google'
  	
  	if (!searchParams.get('id')) {
		return Response.json({
			// id: 0
		 })
	}

	if (searchParams.get('provider') !== null) {
		provider = searchParams.get('provider')
	}

	let mongoClient = await clientPromise

	var db = await mongoClient.db('tabr')
	var accounts = await db.collection('accounts')
	var account = await accounts.findOne({ 
		userId: new ObjectId(searchParams.get('id')),
		provider: provider
	})
	// console.log(account)
	if (!account) {
		return Response.json({ 
			// account: 0
		})
	}

	// Check for refresh
	if (provider === 'google') {
		if (account.expires_at && new Date(account.expires_at * 1000) < new Date()) {
			console.log('Token expired', session)

			let refreshResponse = await fetch(process.env.NEXTAUTH_URL + '/api/refresh?id=' + searchParams.get('id'), { 
				method: 'POST',
				// body: JSON.stringify({ session: session }),
				headers: new Headers(headers()),
			}).then(r => r.json())
			console.log('refreshResponse', refreshResponse)

			account = await accounts.findOne({ 
				userId: new ObjectId(searchParams.get('id')),
				provider: 'google'
			})
		}
	}
	if (provider === 'spotify') {
		var spotifyAuth = new SpotifyWebApi({
			clientId: process.env.SPOTIFY_CLIENT_ID,
			clientSecret: process.env.SPOTIFY_CLIENT_SECRET
		})    
	
		spotifyAuth.setAccessToken(account.access_token)
		spotifyAuth.setRefreshToken(account.refresh_token)

		// TODO: Check to see if this works
		if (new Date() > new Date(account['expires_at'] * 1000)) {
			console.log('(Account) Refreshing access token...', account)
			let refresh = await spotifyAuth.refreshAccessToken().catch(err => console.log('auth error:' , err))
				// .then(async r => {
			console.log('Spotify access token refreshed:', refresh)
			let newAccessToken = refresh.body['access_token']
			let newRefreshToken = refresh.body['refresh_token']
			spotifyAuth.setAccessToken(newAccessToken)
			spotifyAuth.setRefreshToken(newRefreshToken)
			let mongoClient = await clientPromise
			var db = await mongoClient.db('tabr')
			var cl = await db.collection('accounts')
			let newObj = { 
				'access_token': newAccessToken,
				'refresh_token': newRefreshToken,
				'expires_at': parseInt(
					new Date(new Date().setSeconds(new Date().getSeconds() + refresh.body['expires_in'])).getTime() / 1000
				)
				// 'expires_at': new Date(refresh.body['expires_at']),
				// 'expires_at': new Date(new Date().setHours(new Date().getHours() + 1))
			}
			var userResponse = await cl.updateOne({ 
				_id: new ObjectId(account['_id'])
			}, {
				'$set': newObj
			})
			account = {
				...account,
				...newObj
			}
			console.log('spotify account refreshed:', account, refresh)
			// })
		}
	}
	
	return Response.json({
		...account,
		client_id: process.env.AUTH_GOOGLE_ID,
		api_key: process.env.AUTH_GOOGLE_API_KEY,
		app_id: process.env.GOOGLE_APP_ID,
	})
//   return Response.json({ })
}

export async function POST(request, { params }) {
	console.log('POST', {
		// request,
		params
	})

	// const session = await auth()
	// console.log('get user account:', session)
	const searchParams = request.nextUrl.searchParams
	
	if (!searchParams.get('id')) {
	  return Response.json({ })
	}

	let body = await request.json()
	console.log('body:', body )
	if (!body.access_token) {
	  return Response.json({ }, { status: 500 })
	}
	let mongoClient = await clientPromise

	var db = await mongoClient.db('tabr')
	var accounts = await db.collection('accounts')
	let provider = 'google'

	var update = await accounts.findOneAndUpdate(
		{ 
			userId: new ObjectId(searchParams.get('id')),
			provider: provider,
		}, {'$set':{ 
			...body,
			userId: new ObjectId(searchParams.get('id')),
		}}, { 
			upsert: true, 
			returnNewDocument: true,
		}
	)

  return Response.json({ update })
}

