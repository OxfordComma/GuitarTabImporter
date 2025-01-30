import clientPromise from "lib/db.js"
import { ObjectId } from 'mongodb'
// import { getSession } from "next-auth/react"
import { auth } from 'auth'
import { headers } from "next/headers"

export async function GET(request, { params }) {
	// console.log('GET', {
	// 	request,
	// 	// params
	// })
	const session = await auth()
	// const session = await fetch(process.env.NEXTAUTH_URL + '/api/auth/session').then(r => r.json())
	console.log('account session:', session)
	const searchParams = request.nextUrl.searchParams
  	
  	if (!searchParams.get('id')) {
		return Response.json({
			id: 0
		 })
	}

	let mongoClient = await clientPromise

	var db = await mongoClient.db('tabr')
	// console.log('db:', db)
	var accounts = await db.collection('accounts')
	var account = await accounts.findOne({ 
		userId: new ObjectId(searchParams.get('id')),
		provider: 'google'
	})
	// console.log(account)
	if (!account) {
		return Response.json({ 
			account: 0
		})
	}

	// Check for refresh
	if (account.expires_at && new Date(account.expires_at * 1000) < new Date()) {
		console.log('Token expired', session)
		let refreshResponse = await fetch(process.env.NEXTAUTH_URL + '/api/refresh?id=' + searchParams.get('id'), { 
			method: 'POST',
			// body: JSON.stringify({ session: session }),
			headers: headers(),
		}).then(r => r.json())
		console.log('refreshResponse', refreshResponse)

		account = await accounts.findOne({ 
			userId: new ObjectId(searchParams.get('id')),
			provider: 'google'
		})
	}

	return Response.json({
		...account,
		client_id: process.env.AUTH_GOOGLE_ID,
		api_key: process.env.AUTH_GOOGLE_API_KEY,
	})
//   return Response.json({ })
}

export async function POST(request, { params }) {
	console.log('POST', {
		// request,
		params
	})

	const session = await auth()
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


	var update = await accounts.findOneAndUpdate({ 
			userId: new ObjectId(searchParams.get('id')),
			provider: 'google'
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

