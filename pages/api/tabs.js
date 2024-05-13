import clientPromise from "../../lib/mongodb.js"

export default async function handler(req, res) {
	let mongoClient = await clientPromise

	if (req.method == 'GET' && req.query.userid) {
		var db = await mongoClient.db('tabr')
		var tabs = await db.collection('tabs')
		var tabCursor = tabs.find({ userId: req.query.userid })
		var tabList = await tabCursor.toArray()
		res.status(200).json(tabList)
	}
}


