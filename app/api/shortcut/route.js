import { auth } from "@/lib/auth"; 
import { headers } from "next/headers"

const { google } = require('googleapis');

// export default async function handler(req, res) {
export async function PUT(request, { params }) {
	const body = await request.json()

	const { session, user } = await auth.api.getSession({
		headers: await headers() 
	})

	// let profile = await fetch(`${process.env.NEXTAUTH_URL}/api/profile`, {
	// 	headers: await headers() // Have to pass headers to nested API calls
	// }).then(r => r.json())

	// console.log('create folder body', body)

	if (!('tab' in body)) {
		return Response.json({ error: "No name in request body." }, { status: 500 });
	}
	if (!('folder' in body)) {
		return Response.json({ error: "No name in request body." }, { status: 500 });
	}

	const account = await auth.api.getAccessToken({
		body: {
			providerId: "google"
		},
		headers: await headers() 
	});
  
	const oauth2Client = new google.auth.OAuth2(
		process.env.AUTH_GOOGLE_ID, 
		process.env.AUTH_GOOGLE_SECRET
	);

	oauth2Client.setCredentials({
		'access_token': account['accessToken'],
		// 'refresh_token': account.refresh_token
	});

	const drive = google.drive({version: 'v3', auth: oauth2Client });

	let {
		artistName,
		songName,
		googleDocsId,
	} = body['tab']

	const shortcut = await drive.files.create({
		resource: { 
			name: `${artistName} - ${songName}`,
			mimeType: 'application/vnd.google-apps.shortcut',
			shortcutDetails: {
				targetId: googleDocsId,
			},
			parents: [body['folder']]
		}
	})

	return Response.json( shortcut )
}

export async function DELETE(request, { params }) {	

	const body = await request.json()

	const { session, user } = await auth.api.getSession({
		headers: await headers() 
	})


	if (!('record' in body)) {
		return Response.json({ error: "No record in request body." }, { status: 500 });
	}

	const account = await auth.api.getAccessToken({
		body: {
			providerId: "google"
		},
		headers: await headers() 
	});
  
	const oauth2Client = new google.auth.OAuth2(
		process.env.AUTH_GOOGLE_ID, 
		process.env.AUTH_GOOGLE_SECRET
	);

	oauth2Client.setCredentials({
		'access_token': account['accessToken'],
		// 'refresh_token': account.refresh_token
	});

	const drive = google.drive({version: 'v3', auth: oauth2Client });

	let {
		id
	} = body['record']

	var googleDoc = await drive.files.delete({
		fileId: id,
	})

	return Response.json(googleDoc)
}