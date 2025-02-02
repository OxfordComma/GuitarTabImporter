import { getSession } from "next-auth/react"
import { headers } from "next/headers"

const {google} = require('googleapis');
import { auth } from 'auth'

export async function GET(request, { params }) {

	const session = await auth()
	console.log('folder session:', session)

	// Pass headers to allow nested api call to access session
	let account = await fetch(`${process.env.NEXTAUTH_URL}/api/account?id=${session.user_id}`, { 
		headers: new Headers(headers()) 
	}).then(r => r.json())
	console.log('folder account', account)

	let profile = await fetch(`${process.env.NEXTAUTH_URL}/api/profile?id=${session.user_id}`).then(r => r.json())
	console.log('folder profile', profile)
	
	let searchParams = request.nextUrl.searchParams
	// console.log('searchParams', searchParams)
	// let body = await request.json()
	// console.log('get folder body', body)

	if (!searchParams.get('id')) {
		return Response.json({ })
	}
  

	const oauth2Client = new google.auth.OAuth2(
		process.env.AUTH_GOOGLE_ID, 
		process.env.AUTH_GOOGLE_SECRET
	);

	oauth2Client.setCredentials({
		'access_token': account.access_token,
		'refresh_token': account.refresh_token
	});

	const drive = google.drive({version: 'v3', auth: oauth2Client });
	// var newFolder = await drive.files.get({
	// 	resource: { 
	// 		name: body.name,
	// 		mimeType: 'application/vnd.google-apps.folder',
	// 		parents: [body.parent_folder],
	// 	}
	// })

	const fileList = [];

	let NextPageToken = "";
	do {
		const params = {
			q: `parents in '${searchParams.get('id')}' and trashed=false`,
			pageToken: NextPageToken || "",
			pageSize: 1000,
			// fields: "nextPageToken, incompleteSearch, files(*)",
			fields: "nextPageToken, incompleteSearch, files(id, name, starred, createdTime, mimeType, shortcutDetails)",
					// mimeType: 'application/vnd.google-apps.folder',
			corpora: 'user',
			supportsAllDrives: true,
			includeItemsFromAllDrives: true,
		};
		const res = await drive.files.list(params);
		
		Array.prototype.push.apply(fileList, res.data.files);
		// console.log('result data',  { res })
		NextPageToken = res.data.nextPageToken;

	} while (NextPageToken);
  
	// console.log('file list', fileList.length)

	return Response.json(fileList)



}

// export default async function handler(req, res) {
export async function POST(request, { params }) {
	const session = await auth()
	// console.log('folder post session', session)

  let account = await fetch(`${process.env.NEXTAUTH_URL}/api/account?id=${session.user_id}`).then(r => r.json())
  console.log('fetched account', account)
  let profile = await fetch(`${process.env.NEXTAUTH_URL}/api/profile?id=${session.user_id}`).then(r => r.json())
  console.log('fetched profile', profile)

  let body = await request.json()
  console.log('create folder body', body)

  if (!body.name && !body.parent_folder) {
		return Response.json({ })
	}
  

  const oauth2Client = new google.auth.OAuth2(
		process.env.AUTH_GOOGLE_ID, 
		process.env.AUTH_GOOGLE_SECRET
	);

	oauth2Client.setCredentials({
		'access_token': account.access_token,
		'refresh_token': account.refresh_token
	});

	const drive = google.drive({version: 'v3', auth: oauth2Client });
	var newFolder = await drive.files.create({
		resource: { 
			name: body.name,
			mimeType: 'application/vnd.google-apps.folder',
			parents: [body.parent_folder],
		}
	})

	// res.status(200).send(JSON.stringify(googleDoc))
	return Response.json(newFolder)

}