import clientPromise from "../../lib/mongodb.js"
import { ObjectID } from "mongodb"

export default async function handler(req, res) {
	let mongoClient = await clientPromise

	if (req.method == 'GET' && req.query.userid) {
		var db = await mongoClient.db('tabr')
		var tabs = await db.collection('projects')
		var tabCursor = tabs.find({ creator: ObjectID(req.query.userid) })
		var tabList = await tabCursor.toArray()
		res.status(200).json(tabList)
	}
	else {
		res.status(404)
	}
}


