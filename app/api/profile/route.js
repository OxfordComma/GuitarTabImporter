import clientPromise from "lib/db.js"
import { ObjectId } from 'mongodb'
// import { getSession } from "next-auth/react"
import { auth } from 'auth'

export async function GET(request, { params }) {
	console.log('GET', {
		// request,
		params
	})
		const session = await auth()
		console.log('get user session:', session)
		const searchParams = request.nextUrl.searchParams
  	// console.log(request.nextUrl.searchParams)
  	// console.log('session', session)
  	if (!searchParams.get('id')) 
		  return Response.json({ })


		let mongoClient = await clientPromise

		var db = await mongoClient.db('tabr')
		// console.log('db:', db)
		var profiles = await db.collection('profiles')
		var profile = await profiles.findOne({ 
			userId: searchParams.get('id'),
			// email: session.data.user.email 
		})
		// console.log(profile)
	  return Response.json({
	  	...profile,
      client_id: process.env.AUTH_GOOGLE_ID,
      api_key: process.env.AUTH_GOOGLE_API_KEY,
  	})

}

export async function POST(request, { params }) {
	console.log('POST', {
		// request,
		params
	})

	let body = await request.json()
	console.log('body:', body )
		if (!(body.id) || !(body.folder || body.projectsFolder || body.instruments || body.lastOpenedProject)) {
		  return Response.json({ }, { status: 500 })
		}
		let mongoClient = await clientPromise

		var db = await mongoClient.db('tabr')
		var profiles = await db.collection('profiles')
		// var profile = await profiles.findOne({ 
		// 	_id: new ObjectId(body.id) 
		// })

		let newObj = {}
		if (body.folder) newObj = { ...newObj, folder: body.folder }
		if (body.libraryFolder) newObj = { ...newObj, libraryFolder: body.libraryFolder }
		if (body.projectsFolder) newObj = { ...newObj, projectsFolder: body.projectsFolder }
		if (body.instruments) newObj = { ...newObj, instruments: body.instruments }
		if (body.lastOpenedProject) newObj = { ...newObj, lastOpenedProject: body.lastOpenedProject }

		var update = await profiles.updateOne({ 
				userId: body.id
			}, {
				'$set': newObj
			}, {
				upsert: true,
			}
		)

	  return Response.json({ newObj, update})

	// let session = await getSession({ req })
	// console.log('session:', session)
	// let mongoClient = await clientPromise


	// if (req.method == 'GET') {
	// 	var db = await mongoClient.db('tabr')
	// 	// console.log('db:', db)
	// 	var users = await db.collection('users')
	// 	var user = await users.findOne({ email: session.user.email })
	// 	console.log(user)
	// 	res.send(user)
	// }

	// if (req.method == 'POST' && req.body) {
  // 	let body = JSON.parse(req.body)
  // 	console.log('body', body)
	// 	if (!(body.email) && !(body.folder || body.projectsFolder || body.instruments || body.lastOpenedProject)) {
	// 		res.send(500)
	// 	}


	// 	var db = await mongoClient.db('tabr')
	// 	var users = await db.collection('users')
	// 	var user = await users.findOne({ email: body.email })

	// 	let newObj = {}
	// 	if (body.folder) newObj = { ...newObj, folder: body.folder }
	// 	if (body.projectsFolder) newObj = { ...newObj, projectsFolder: body.projectsFolder }
	// 	if (body.instruments) newObj = { ...newObj, instruments: body.instruments }
	// 	if (body.lastOpenedProject) newObj = { ...newObj, lastOpenedProject: body.lastOpenedProject }

	// 	var update = await users.updateOne({ 
	// 			email: body.email
	// 		}, {'$set': newObj
	// 	})

	// 	res.send(update)
	// }
  return Response.json({ })
}