import clientPromise from "../../lib/mongodb.js"
import { ObjectID } from "mongodb"

export default async function handler(req, res) {
	let mongoClient = await clientPromise

	console.log(req.method)

	if (req.method == 'GET' && req.query.id) {
		var db = await mongoClient.db('tabr')
		var collection = await db.collection('projects')
		var cursor = collection.find({ id: req.query.id })
		var resultsList = await cursor.toArray()
		res.status(200).json(resultsList)
	}
	else {
		res.status(404)
	}


	if (req.method == 'POST') {
		let body = JSON.parse(req.body)
		console.log('project body', body)
		console.log('project pinnedTabs', (body.pinnedTabs || body.pinnedTabs.length > 0))

		if (!(body.id) && !(body.name || body.folder || body.creator || body.owner || body.collaborators || (body.pinnedTabs || body.pinnedTabs.length > 0)))
			res.status(404)

		var db = await mongoClient.db('tabr')
		var collection = await db.collection('projects')

		let newObj = {}
		if (body.name) newObj = {...newObj, name: body.name }
		if (body.folder) newObj = {...newObj, folder: body.folder }
		if (body.creator) newObj = {...newObj, creator: ObjectID(body.creator) }
		if (body.owner) newObj = {...newObj, owner: ObjectID(body.owner) }
		if (body.collaborators) newObj = {...newObj, collaborators: body.collaborators }
		if (body.spotifyPlaylistId) newObj = {...newObj, spotifyPlaylistId: body.spotifyPlaylistId }
		if (body.pinnedTabs) newObj = {...newObj, pinnedTabs: body.pinnedTabs }

		var update = await collection.updateOne({ 
				id: body.id
			}, {
				'$set': newObj
			}, {
				upsert: true,
			}
		)

		res.status(200).send(update)
	}

	if (req.method == 'DELETE') {
		let body = JSON.parse(req.body)
		if (!(body.id))
			res.status(404)

		var db = await mongoClient.db('tabr')
		var collection = await db.collection('projects')

		var deleted = await collection.findOneAndDelete({ 
				id: body.id
			}
			// , {
			// 	'$set':{ 
			// 		id: body.id,
			// 		name: body.name,
			// 		folder: body.folder,
			// 		creator: ObjectID(body.creator),
			// 		owner: ObjectID(body.owner),
			// 		collaborators: body.collaborators,
			// 		spotifyPlaylistId: body.spotifyPlaylistId,
			// 	}
			// }, {
			// 	upsert: true,
			// }
		)

	}

	res.status(200).send(deleted)

}


