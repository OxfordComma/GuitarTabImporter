import clientPromise from "lib/db.js"
import { auth } from "@/lib/auth"; // path to your Better Auth server instance
import { headers } from "next/headers";
import { ObjectId } from 'mongodb'

const mongoClient = await clientPromise
const db = await mongoClient.db(process.env.MONGO_CLIENT_DB)
var mongoCollection = await db.collection('profiles')

// Search and return a record
export async function GET(request, { params }) {

	// Get user session
	const { session, user } = await auth.api.getSession({
		headers: await headers() // you need to pass the headers object.
	})

	if (!session?.userId) {
		return Response.json({ error: "No userId in session." }, { status: 500 });
	}

	var record = await mongoCollection.findOne({
		userId: new ObjectId(session.userId),
	})

	return Response.json(record)
}

// Create a new record with no specified id
export async function POST(request, { params }) {
	let body = await request.json()

	// Get user session
	const { session, user } = await auth.api.getSession({
		headers: await headers() // you need to pass the headers object.
	})

	if (!('userId' in session)) {
		return Response.json({ error: "No userId in session." }, { status: 500 });
	}

	if (!('profile' in body)) {
		return Response.json({ error: "No profile in request body." }, { status: 500 });
	}

	const addtoRecord = {
		...body['profile']
	}

	const newRecord = {
		...addtoRecord,
		userId: ObjectId.createFromHexString(session.userId),
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

	if (!('userId' in session)) {
		return Response.json({ error: "No userId in session." }, { status: 500 });
	}

	const { _id, ...addtoRecord } = body['profile']

	const newRecord = {
		...addtoRecord,
		userId: ObjectId.createFromHexString(session.userId),
	}

	const result = await mongoCollection.findOneAndUpdate({
		_id: ObjectId.createFromHexString(_id),
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
