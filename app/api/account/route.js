import clientPromise from "lib/db.js"
import { ObjectId } from 'mongodb'
// import { getSession } from "next-auth/react"
import { auth } from 'auth'

export async function GET(request, { params }) {
	console.log('GET', {
		// request,
		params
	})
	const session = await auth()
	console.log('get user account:', session)
	const searchParams = request.nextUrl.searchParams
  	
  	if (!searchParams.get('id')) 
		return Response.json({ })

	let mongoClient = await clientPromise

	var db = await mongoClient.db('tabr')
	// console.log('db:', db)
	var accounts = await db.collection('accounts')
	var account = await accounts.findOne({ 
		userId: searchParams.get('id'),
		provider: 'google'
	})
	// console.log(account)
	if (!account) {
		return Response.json({ })
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
	console.log('get user account:', session)
	// const searchParams = request.nextUrl.searchParams
	
	// if (!searchParams.get('id')) 
	  // return Response.json({ })

	let body = await request.json()
	console.log('body:', body )
	if (!body.access_token) {
	  return Response.json({ }, { status: 500 })
	}
	let mongoClient = await clientPromise

	var db = await mongoClient.db('tabr')
	var accounts = await db.collection('accounts')


	var update = await accounts.findOneAndUpdate({ 
			userId: session.user_id,
			provider: 'google'
		}, {'$set':{ 
			...body,
		}}, { 
			upsert: true, 
			returnNewDocument: true,
		}
	)

  return Response.json({ update})
}

