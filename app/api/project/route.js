import clientPromise from "lib/db.js"
import { auth } from "@/lib/auth"; // path to your Better Auth server instance
import { headers } from "next/headers";
import { ObjectId } from 'mongodb'

const mongoClient = await clientPromise
const db = await mongoClient.db(process.env.MONGO_CLIENT_DB)
var mongoCollection = await db.collection('projects')

// Search and return a record
export async function GET(request, { params }) {

	// Get user session
	const { session, user } = await auth.api.getSession({
		headers: await headers() // you need to pass the headers object.
	})

	if (!session?.userId) {
		return Response.json({ error: "No userId in session." }, { status: 500 });
	}

	const searchParams = request.nextUrl.searchParams

	// If an id is provided, return just that record
	if (searchParams.has('id')) {
		var cursor = await mongoCollection.find({
			userId: ObjectId.createFromHexString(session.userId),
			_id: ObjectId.createFromHexString(searchParams.get('id'))
		})

		let cursorList = await cursor.toArray()

		return Response.json(cursorList)
	}

	// Otherwise, return all records for the user
	else {
		var cursor = await mongoCollection.find({
			userId: new ObjectId(session.userId),
		})
		let cursorList = await cursor.toArray()

		return Response.json(cursorList)
	}
}

// Create a new record with no specified id
export async function POST(request, { params }) {
	let body = await request.json()

	// Get user session
	const { session, user } = await auth.api.getSession({
		headers: await headers() // you need to pass the headers object.
	})

	if (!session?.userId) {
		return Response.json({ error: "No userId in session." }, { status: 500 });
	}

	if (!('record' in body)) {
		return Response.json({ error: "No record in request body." }, { status: 500 });
	}

	const addtoRecord = {
		...body['record']
	}

	const newRecord = {
		...addtoRecord,
		userId: ObjectId.createFromHexString(session.userId),
		createdTime: new Date(addtoRecord?.createdTime) ?? new Date(),
		lastUpdatedTime: new Date(addtoRecord?.lastUpdatedTime) ?? new Date(),
	}

	const result = await mongoCollection.insertOne(newRecord)
	console.log(
		`A document was inserted with ObjectId ${result.insertedId}.`
	)
	return Response.json(result)
}

// Update a record at a specific ID
export async function PUT(request, { params }) {
	const searchParams = request.nextUrl.searchParams
	const body = await request.json()

	const { session, user } = await auth.api.getSession({
		headers: await headers() // you need to pass the headers object.
	})

	if (!(searchParams.has('id'))) {
		return Response.json({ error: "No id provided for record." }, { status: 500 });
	}
	if (!('record' in body)) {
		return Response.json({ error: "No record in request body." }, { status: 500 });
	}
	const { _id, ...addtoRecord } = body['record']
	//   for (const key of Object.keys(addtoRecord)) {
	// 	if (key in addtoRecord) {
	// 	  newRecord[key] = addtoRecord[key]
	// 	}
	//   }

	const newRecord = {
		...addtoRecord,
        tabIds: addtoRecord.tabIds.map(t => ({
			...t,
			tabId: ObjectId.createFromHexString(t['tabId'])
		}) ),
		userId: ObjectId.createFromHexString(session.userId),
		// createdTime: new Date(addtoRecord?.createdTime) ?? new Date(),
		// lastUpdatedTime: new Date(addtoRecord?.lastUpdatedTime) ?? new Date(),
	}

	const result = await mongoCollection.findOneAndUpdate({
		_id: ObjectId.createFromHexString(searchParams.get('id')),
	}, {
		'$set': newRecord
	}, {
		returnDocument: 'after'
	})
	console.log(
		`A document was updated with ObjectId ${result['_id']}.`
	)
	return Response.json(result)
}

// Delete the record at the specified location
export async function DELETE(request, { params }) {
	const searchParams = request.nextUrl.searchParams

	if (searchParams.has('id')) {
		const result = await mongoCollection.findOneAndDelete({
			_id: ObjectId.createFromHexString(searchParams.get('id'))
		})
		console.log(
			`A document was deleted with ObjectId ${result._id}.`
		)
		return Response.json(result)
	}
	else {
		return Response.json({ error: "No id provided for deletion." }, { status: 500 });
	}
}


// import clientPromise from "lib/db.js"
// import { ObjectId } from 'mongodb'
// // import { getSession } from "next-auth/react"
// import { auth } from 'auth'

// export async function GET(request, { params }) {
// 	console.log('GET', {
// 		// request,
// 		params
// 	})
//     const searchParams = request.nextUrl.searchParams
//     console.log('searchParams', searchParams)

//     if (!searchParams.get('id'))  {
//         if (!searchParams.get('userid'))  {
//             return Response.json({ })
//         }
        
//         return Response.json({
//             _id: new ObjectId(),
//             // id: Math.random().toString(16).slice(2),
//             name: 'New Project',
//             owner: new ObjectId(searchParams.get('userid')),
//             creator: new ObjectId(searchParams.get('userid')),
//             collaborators: [],
//             folder: null,
//         })
//     }
//     let mongoClient = await clientPromise

//     let db = await mongoClient.db('tabr')
//     let cl = await db.collection('projects')

//     let project = await cl.findOne({ 
//         _id: new ObjectId( searchParams.get('id') )
//     })

//     if (!('_id' in project)) {
//         return Response.json({ })
//     }
		
//     return Response.json(
//         project
//     )
// }


// export async function POST(request, { params }) {
//     const searchParams = request.nextUrl.searchParams
//     let body = await request.json()
//     console.log('project post body', body)
	
//     // if (!searchParams.get('id'))  {
//     //     return Response.json({ })
//     // }

//     let mongoClient = await clientPromise
// 	var db = await mongoClient.db('tabr')
// 	var projects = await db.collection('projects')
	
//     let newProject = {
//         "_id": new ObjectId(body._id),
//         "collaborators": body.collaborators,
//         "creator": new ObjectId(body.creator),
//         "folder": body.folder,
//         // "id": body.id,
//         "name": body.name,
//         "owner": new ObjectId(body.owner),
//         "pinnedTabs": body.pinnedTabs,
//         "spotifyPlaylistId": body.spotifyPlaylistId,
//       }

//       var update = await projects.updateOne({ 
//             _id: new ObjectId(newProject._id)
//         }, {
//             '$set': newProject
//         }, {
//             upsert: true,
//         }
//     )

//     return Response.json({
//        newProject
//     })
// }

// export async function DELETE(request, { params }) {
//     let body = await request.json()
//     const searchParams = request.nextUrl.searchParams
//     let _id = body._id
//     if (!_id) {
//         return Response.json({ }, { status: 500 })
//     }

//     let mongoClient = await clientPromise

//     let db = await mongoClient.db('tabr')
//     let tabs = await db.collection('projects')

//     var tab = await tabs.findOneAndDelete({ 
//         _id: new ObjectId(_id)
//     })

//     return Response.json(
//         tab
//     )

// }
    
