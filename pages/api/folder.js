import clientPromise from "../../lib/mongodb.js"
import { getSession } from "next-auth/react"
const {google} = require('googleapis');

export default async function handler(req, res) {
	const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_ID, process.env.GOOGLE_SECRET);
	let session = await getSession({ req })
	let mongoClient = await clientPromise
	console.log('folder session:', session)

	if (req.method == 'GET') {

		var db = await mongoClient.db('tabr')
		var users = await db.collection('users')
		var user = await users.findOne({ email: session.user.email })

		var id = user._id
		var accounts = await db.collection('accounts')
		var account = await accounts.findOne({ userId: id })

		let folder = req.query.folder
		let starred = req.query?.starred=='true'

		oauth2Client.setCredentials({
			'access_token': account.access_token,
			'refresh_token': account.refresh_token
		});

		const drive = google.drive({ 
			version: 'v3', 
			auth: oauth2Client,
		});
	  const fileList = [];

		let NextPageToken = "";
	  do {
	    const params = {
	      q: `'${folder}' in parents and trashed=false`,
	      pageToken: NextPageToken || "",
	      pageSize: 1000,
	      fields: "nextPageToken, files(id, name, starred, createdTime, mimeType, shortcutDetails)",
	      corpora: 'allDrives',
	      supportsAllDrives: true,
	      includeItemsFromAllDrives: true,
	      
	    };
	    const res = await drive.files.list(params);
	    
	    Array.prototype.push.apply(fileList, res.data.files);
	    NextPageToken = res.data.nextPageToken;

	    // console.log(res.data.files.length)
	  } while (NextPageToken);

		res.send(fileList)
		return;
	}

	if (req.method == 'POST' && req.body) {
		let body = JSON.parse(req.body)
		
		if (body.name && body.folder && body.user) {
			var db = await mongoClient.db('tabr')
			var users = await db.collection('users')
			var user = await users.findOne({ email: body.user.email })

			var id = user._id
			var accounts = await db.collection('accounts')
			var account = await accounts.findOne({ userId: id })

			let folder = body.folder

			oauth2Client.setCredentials({
				'access_token': account.access_token,
				'refresh_token': account.refresh_token
			});

			const drive = google.drive({ 
				version: 'v3', 
				auth: oauth2Client,
			});
		// Create
			var newFolder = await drive.files.create({
				resource: { 
					name: body.name,
					mimeType: 'application/vnd.google-apps.folder',
					parents: [folder]
				}
			})

			res.status(200).send(JSON.stringify(newFolder.data))
			return;
		}
	}
	else {
		res.send(500)
		return;
	}
}