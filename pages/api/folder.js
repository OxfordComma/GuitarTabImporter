import clientPromise from "../../lib/mongodb.js"
import { getSession } from "next-auth/react"
const {google} = require('googleapis');

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

	// let url = req.query.url
	let folder = req.query.folder

	// let response = await fetch(process.env.NEXTAUTH_URL + '/api/tab?url='+url).then(r => r.json())
	// console.log(response)
	// let artist = response.artist
	// let songName = response.songName
	// let rawTabs = response.tabs

	oauth2Client.setCredentials({
		'access_token': account.access_token,
		'refresh_token': account.refresh_token
	});



	// const docs = google.docs({version: 'v1', auth: oauth2Client });
	const drive = google.drive({ 
		version: 'v3', 
		auth: oauth2Client,
		// auth: new google.auth.GoogleAuth({
		// 	keyFile: '/Users/nick/Projects/knowledge-finder/spotifyplaylistupdater-e6562b298e60.json',
		// 	scopes: ['https://www.googleapis.com/auth/drive'],
		// })
	});
  const fileList = [];
  // console.log(`'${folder}' in parents`)
	let NextPageToken = "";
  do {
    const params = {
      q: `'${folder}' in parents`,
      // orderBy: "name",
      pageToken: NextPageToken || "",
      pageSize: 1000,
      fields: "nextPageToken, files(id, name)",
      corpora: 'allDrives',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      
    };
    const res = await drive.files.list(params);
    // const get1 = await drive.files.get({
    // 	fileId: '16R43BPlzRXM3jigwQn08j1kngj6sKVygn0XHr-MbwVY'
    // })
    // console.log(get1)
    // const get2 = await drive.files.get({
    // 	fileId: '1vW_SOXuq7jMZ6jd63x3jY6CSOLkJGXzUA8eivPataf8'
    // })

    Array.prototype.push.apply(fileList, res.data.files);
    NextPageToken = res.data.nextPageToken;
    console.log(NextPageToken)
    console.log(res.data.files.length)
  } while (NextPageToken);

	// var googleDoc = await drive.files.list({
	// 	// q: '\'' + folder.toString() + '\' in parents',
	// 	pageSize: 250,
	// }).then(response => {
	// 	console.log('response:', response)
	// 	return response.data.files
	// })
	// console.log(fileList)
	res.send(fileList)
}