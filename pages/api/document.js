import clientPromise from "../../lib/mongodb.js"
import { getSession } from "next-auth/react"
const {google} = require('googleapis');


// 
export default async function handler(req, res) {
	const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_ID, process.env.GOOGLE_SECRET);

	let session = await getSession({ req })

	let mongoClient = await clientPromise
	var db = await mongoClient.db('tabr')
	var users = await db.collection('users')
	var user = await users.findOne({ email: session.user.email })

	var id = user._id
	var accounts = await db.collection('accounts')
	var account = await accounts.findOne({ userId: id })

	let documentId = req.query.documentid


	oauth2Client.setCredentials({
		'access_token': account.access_token,
		'refresh_token': account.refresh_token
	});

	const drive = google.drive({ 
		version: 'v3', 
		auth: oauth2Client,
	});
  
  const fileExport = await drive.files.export({
  	fileId: documentId,
  	mimeType: 'text/plain'
	}).then(success => {
		// console.log(success.data)
		res.json(success.data)
	}).catch(failure => console.log(failure))
}