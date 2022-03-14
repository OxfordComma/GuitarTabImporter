import clientPromise from "../../lib/mongodb.js"
import { getSession } from "next-auth/react"

export default async function handler(req, res) {
	let session = await getSession({ req })
	let mongoClient = await clientPromise

	if (req.method == 'GET') {
		var db = await mongoClient.db('guitartabimporter')
		var users = await db.collection('users')
		var user = await users.findOne({ email: session.user.email })
		console.log(user)
		res.send(user)
	}

	if (req.method == 'POST' && req.query.folder) {
		var db = await mongoClient.db('guitartabimporter')
		var users = await db.collection('users')
		var user = await users.findOne({ email: session.user.email })

		var update = await users.updateOne({ 
				email: session.user.email
			}, {'$set':{ 
				folder: req.query.folder
			}
		})

		res.send(update)
	}
}