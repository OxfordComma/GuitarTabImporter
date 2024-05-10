import clientPromise from "../../lib/mongodb.js"
import { getSession } from "next-auth/react"

export default async function handler(req, res) {
	let session = await getSession({ req })
	console.log('session:', session)
	let mongoClient = await clientPromise


	if (req.method == 'GET') {
		var db = await mongoClient.db('tabr')
		// console.log('db:', db)
		var users = await db.collection('users')
		var user = await users.findOne({ email: session.user.email })
		console.log(user)
		res.send(user)
	}

	if (req.method == 'POST' && req.body) {
  	let body = JSON.parse(req.body)
  	console.log('body', body)
		if (!(body.folder && body.projectsFolder && body.email)) {
			res.send(500)
		}


		var db = await mongoClient.db('tabr')
		var users = await db.collection('users')
		var user = await users.findOne({ email: body.email })

		var update = await users.updateOne({ 
				email: body.email
			}, {'$set':{ 
				folder: body.folder,
				projectsFolder: body.projectsFolder,
				instruments: body.instruments,
			}
		})

		res.send(update)
	}
}