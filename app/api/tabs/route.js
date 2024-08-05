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
  	
  	if (!searchParams.get('userid')) 
		  return Response.json({ })

		let mongoClient = await clientPromise

		let db = await mongoClient.db('tabr')
		let cl = await db.collection('tabs')

		let cursor = cl.find({ 
			userId: searchParams.get('userid') 
		})
		let cursorList = await cursor.toArray()
		
	  return Response.json(
	  	cursorList
  	)

}
