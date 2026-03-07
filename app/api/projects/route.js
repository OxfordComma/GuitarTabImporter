import clientPromise from "lib/db.js"
import { ObjectId } from 'mongodb'
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const mongoClient = await clientPromise
const db = await mongoClient.db(process.env.MONGO_CLIENT_DB)
var mongoCollection = await db.collection('projects')

export async function GET(request, { params }) {
	const { session, user } = await auth.api.getSession({
		headers: await headers() 
	})
	if (!session?.userId) {
		return Response.json({ error: "No userId in session." }, { status: 500 });
	}

	let cursor = mongoCollection.find({
		userId: ObjectId.createFromHexString(session['userId'])
	})
	let cursorList = await cursor.toArray()

	return Response.json(
		cursorList
	)
}
