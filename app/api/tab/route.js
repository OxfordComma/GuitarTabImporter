import clientPromise from "lib/db.js"
import { ObjectId } from 'mongodb'
// import { getSession } from "next-auth/react"
import { auth } from 'auth'

export async function GET(request, { params }) {
	// console.log('GET', {
	// 	// request,
	// 	params
	// })
		// const session = await auth()
		// console.log('get user account:', session)
		const searchParams = request.nextUrl.searchParams
  	
  	if (!searchParams.get('id')) 
		  return Response.json({ })

		let mongoClient = await clientPromise

		let db = await mongoClient.db('tabr')
		let tabs = await db.collection('tabs')

		let tab = tabs.findOne({ 
			id: searchParams.get('id') 
		})
		// let tabList = await tabCursor.toArray()
		
	  return Response.json(
	  	tab
  	)

}

export async function POST(request, { params }) {
	console.log('POST', {
		// request,
		params
	})

	let body = await request.json()

	if (!body.id) {
	  return Response.json({ }, { status: 500 })
	}
	if (!body._id) {
		body['_id'] = new ObjectId()
	}
	let mongoClient = await clientPromise

	var db = await mongoClient.db('tabr')
	var tabs = await db.collection('tabs')
	let { _id, ...setParams } = body
	var update = await tabs.findOneAndUpdate({
			// id: body.id
			_id: new ObjectId(_id),
		}, {
			'$set':{ 
				...setParams,
				createdTime: new Date(body.createdTime),
				lastUpdatedTime: body.lastUpdatedTime ? new Date(body.lastUpdatedTime) : new Date(body.createdTime)
			}
		}, { 
			upsert: true, 
			returnDocument: 'after',
		}
	)

	return Response.json( update )
}

export async function DELETE(request, { params }) {
// 	console.log('DELETE', {
// 		// request,
// 		params
// 	})
	// let body = await request.json()
	const searchParams = request.nextUrl.searchParams

	const id = searchParams.get('id')

	if (!id) 
	  return Response.json({ }, { status: 500 })

	let mongoClient = await clientPromise

	let db = await mongoClient.db('tabr')
	let tabs = await db.collection('tabs')

	var tab = await tabs.findOneAndDelete({ 
		id: id
	})

	return Response.json(
  	tab
	)

}

