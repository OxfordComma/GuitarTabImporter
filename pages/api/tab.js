import clientPromise from "../../lib/mongodb.js"

export default async function handler(req, res) {
	let mongoClient = await clientPromise

	if (req.method == 'GET' && req.query.tabid) {
		var db = await mongoClient.db('tabr')
		var tabs = await db.collection('tabs')
		var tab = await tabs.findOne({ id: req.query.tabid })
		// console.log(user)
		res.status(200).json(tab)
	}

	if (req.method == 'POST') {
	  let body = JSON.parse(req.body)
	  console.log(body)

	  if (body.id && body.userId) {
	  	var db = await mongoClient.db('tabr')
			var tabs = await db.collection('tabs')

			var update = await tabs.findOneAndUpdate({ 
					id: body.id
				}, {'$set':{ 
					...body
				}}, { 
					upsert: true, 
					returnNewDocument: true,
				}
			)
			res.status(201).json(update)
	  }
	  else {
	  	res.status(500)
	  }
		

	}

	if (req.method == 'DELETE' && req.query.tabid) {
		var db = await mongoClient.db('tabr')
		var tabs = await db.collection('tabs')
		var tab = await tabs.findOneAndDelete({ id: req.query.tabid })

		res.status(200).json(tab)
	}
	else {
		res.send(404)
	}

}