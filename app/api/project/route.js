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