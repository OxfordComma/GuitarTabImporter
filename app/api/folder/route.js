import { auth } from "@/lib/auth"; 
import { headers } from "next/headers"
import { ObjectId } from 'mongodb'

const {google} = require('googleapis');	

export async function GET(request, { params }) {
	// const session = await auth()

	// // Pass headers to allow nested api call to access session
	// let account = await fetch(`${process.env.NEXTAUTH_URL}/api/account?id=${session.user_id}`, { 
	// 	headers: new Headers(headers()) 
	// }).then(r => r.json())

	// let searchParams = request.nextUrl.searchParams
	
	// if (!searchParams.get('id')) {
	// 	return Response.json({ })
	// }

	// const oauth2Client = new google.auth.OAuth2(
	// 	process.env.AUTH_GOOGLE_CLIENT_ID, 
	// 	process.env.AUTH_GOOGLE_SECRET
	// );

	// oauth2Client.setCredentials({
	// 	'access_token': account.access_token,
	// 	'refresh_token': account.refresh_token
	// });

	// const drive = google.drive({version: 'v3', auth: oauth2Client });

	// let fileList = [];

	// let NextPageToken = "";
	// do {
	// 	const params = {
	// 		q: `parents in '${searchParams.get('id')}' and trashed=false`,
	// 		pageToken: NextPageToken || "",
	// 		pageSize: 1000,
	// 		// fields: "nextPageToken, incompleteSearch, files(*)",
	// 		fields: "nextPageToken, incompleteSearch, files(id, name, starred, createdTime, mimeType, shortcutDetails)",
	// 		// mimeType: 'application/vnd.google-apps.folder',
	// 		corpora: 'user',
	// 		supportsAllDrives: true,
	// 		includeItemsFromAllDrives: true,
	// 	};
	// 	const res = await drive.files.list(params);
		
	// 	Array.prototype.push.apply(fileList, res.data.files);

	// 	NextPageToken = res.data.nextPageToken;

	// } while (NextPageToken);
  
	// console.log('file list', fileList.length)

	// // Add ObjectIds
	// fileList = fileList.map(f => {
	// 	return {
	// 		...f,
	// 		_id: new ObjectId(),
	// 	}
	// })

	// return Response.json(fileList)
}

export async function PUT(request, { params }) {
	const body = await request.json()

	const { session, user } = await auth.api.getSession({
		headers: await headers() 
	})

	let profile = await fetch(`${process.env.NEXTAUTH_URL}/api/profile`, {
		headers: await headers() // Have to pass headers to nested API calls
	}).then(r => r.json())

	if (!('id' in body)) {
		return Response.json({ error: "No id in request body." }, { status: 500 });
	}
	if (!('name' in body)) {
		return Response.json({ error: "No name in request body." }, { status: 500 });
	}
	if (!('projectsFolder' in profile)) {
		return Response.json({ error: "No library folder in profile." }, { status: 500 });
	}

	const account = await auth.api.getAccessToken({
		body: {
			providerId: "google"
		},
		headers: await headers() 
	});
  
  	const oauth2Client = new google.auth.OAuth2(
		process.env.AUTH_GOOGLE_CLIENT_ID, 
		process.env.AUTH_GOOGLE_SECRET
	);

	oauth2Client.setCredentials({
		'access_token': account['accessToken'],
		// 'refresh_token': account.refresh_token
	});

	const drive = google.drive({version: 'v3', auth: oauth2Client });
	var newFolder = await drive.files.update({
		fileId: body['id'],
		requestBody: { 
			name: body['name'],
			// mimeType: 'application/vnd.google-apps.folder',
			// parents: [profile['projectsFolder']],
		}
	})

	return Response.json(newFolder)
}

export async function POST(request, { params }) {
	const body = await request.json()

	const { session, user } = await auth.api.getSession({
		headers: await headers() 
	})

	let profile = await fetch(`${process.env.NEXTAUTH_URL}/api/profile`, {
		headers: await headers() // Have to pass headers to nested API calls
	}).then(r => r.json())

	// console.log('create folder body', body)

	if (!('name' in body)) {
		return Response.json({ error: "No name in request body." }, { status: 500 });
	}
	if (!('projectsFolder' in profile)) {
		return Response.json({ error: "No library folder in profile." }, { status: 500 });
	}

	const account = await auth.api.getAccessToken({
		body: {
			providerId: "google"
		},
		headers: await headers() 
	});
  
  	const oauth2Client = new google.auth.OAuth2(
		process.env.AUTH_GOOGLE_CLIENT_ID, 
		process.env.AUTH_GOOGLE_SECRET
	);

	oauth2Client.setCredentials({
		'access_token': account['accessToken'],
		// 'refresh_token': account.refresh_token
	});

	const drive = google.drive({version: 'v3', auth: oauth2Client });
	var newFolder = await drive.files.create({
		requestBody: { 
			name: body['name'],
			mimeType: 'application/vnd.google-apps.folder',
			parents: [profile['projectsFolder']],
		}
	})

	return Response.json(newFolder)
}

export async function DELETE(request, { params }) {	
	// // console.log('folder delete')
	// const session = await auth()
	// let body = await request.json()

	// if (!body._id) {
	// 	Response.json({ })
	// }

	// const _id = body._id
	// console.log('folder delete body:', body, session)	
	// let account = await fetch(`${process.env.NEXTAUTH_URL}/api/account?id=${session.user_id}`, {
	// 	headers: new Headers(headers()) 
	// }).then(r => r.json())
	// console.log('folder delete account', account)

	// const oauth2Client = new google.auth.OAuth2(
	// 	process.env.AUTH_GOOGLE_CLIENT_ID, 
	// 	process.env.AUTH_GOOGLE_SECRET
	// );

	// oauth2Client.setCredentials({
	// 	'access_token': account.access_token,
	// 	'refresh_token': account.refresh_token
	// });

	// const drive = google.drive({version: 'v3', auth: oauth2Client });

	// var googleDoc = await drive.files.delete({
	// 	fileId: _id,
	// })

	// return Response.json(googleDoc)
}