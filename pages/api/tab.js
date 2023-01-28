import clientPromise from "../../lib/mongodb.js"

export default async function handler(req, res) {
	let mongoClient = await clientPromise

	// var song = await getSong(req.query.url)
	// var artist = song.artist;
	// var songName = song.song_name;
	// var tabs = formatRawTabs(song.raw_tabs);

	// res.send({
	// 	artist: artist,
	// 	songName: songName,
	// 	tabs: tabs,
	// })

	if (req.method == 'GET' && req.query.tabid) {
		var db = await mongoClient.db('tabr')
		// console.log('db:', db)
		var tabs = await db.collection('tabs')
		var tab = await tabs.findOne({ tabId: req.query.tabid })
		// console.log(user)
		res.status(200).json(tab)
	}

	if (req.method == 'POST') {
	  let body = JSON.parse(req.body)
	  console.log(body)

	  if (body.id && body.userId && body.tabText && body.tabName) {
	  	var db = await mongoClient.db('tabr')
			var tabs = await db.collection('tabs')
			// var tab = await tabs.findOne({ tabId: body.tabId })

			var update = await tabs.updateOne({ 
					// email: session.user.email
					id: body.id
				}, {'$set':{ 
					// folder: req.query.tabid
					userId: body.userId,
					googleDocsId: body.googleDocsId,
					tabText: body.tabText,
					tabName: body.tabName,
				}}, { 
					upsert: true, 
				}
			)
			res.status(201).json(update)
	  }
	  else {
	  	res.status(500)
	  }
		

	}

}