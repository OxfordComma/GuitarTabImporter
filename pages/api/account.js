import clientPromise from "../../lib/mongodb.js"
import { getSession, useSession } from "next-auth/react"
import { ObjectID } from "mongodb"

export default async function handler(req, res) {
	let session = await getSession({ req })
	console.log('session:', session)
	let mongoClient = await clientPromise

	// if (status === "loading") {
	//   return <p>Loading...</p>
	// }

	if (!session) {
	  return <p>Access Denied</p>
	}

	// Get the logged in user's account information
	if (req.method == 'GET') {
		if (!req.query.userid)
			res.json({ })

		var db = await mongoClient.db('tabr')
		var accounts = await db.collection('accounts')
		var account = await accounts.findOne({ userId: ObjectID(req.query.userid) })
		console.log(account)
		res.send(account)
	}

	// if (req.method == 'POST' && req.query.folder) {
	// 	var db = await mongoClient.db('guitartabimporter')
	// 	var users = await db.collection('users')
	// 	var user = await users.findOne({ email: session.user.email })

	// 	var update = await users.updateOne({ 
	// 			email: session.user.email
	// 		}, {'$set':{ 
	// 			folder: req.query.folder
	// 		}
	// 	})

	// 	res.send(update)
	// }
}