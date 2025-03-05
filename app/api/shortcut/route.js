import { getSession } from "next-auth/react"
import { ObjectId } from 'mongodb'
import { auth } from 'auth'

const { google } = require('googleapis');

// export default async function handler(req, res) {
export async function POST(request, { params }) {	
	const session = await auth()
	let body = await request.json()
	console.log('create body:', body, session)

	
	let account = await fetch(`${process.env.NEXTAUTH_URL}/api/account?id=${session.user_id}`, {
		headers: new Headers(headers()),
	}).then(r => r.json())
	// console.log('fetched account', account)
	let profile = await fetch(`${process.env.NEXTAUTH_URL}/api/profile?id=${session.user_id}`).then(r => r.json())
	// console.log('fetched profile', profile)

	if (!body.tab || !body.folder) {
		Response.json({ })
	}

	const oauth2Client = new google.auth.OAuth2(
		process.env.AUTH_GOOGLE_ID, 
		process.env.AUTH_GOOGLE_SECRET
	);


	oauth2Client.setCredentials({
		'access_token': account.access_token,
		'refresh_token': account.refresh_token
	});

	const docs = google.docs({version: 'v1', auth: oauth2Client });
	const drive = google.drive({version: 'v3', auth: oauth2Client });

	let {
		tabText,
		artistName,
		songName,
		googleDocsId,
		capo,
		tuning,
		bpm,
	} = body.tab

	var googleDoc = await drive.files.create({
		resource: { 
			name: artistName + ' - ' + songName,
			mimeType: 'application/vnd.google-apps.shortcut',
			shortcutDetails: {
				targetId: googleDocsId,
			},
			parents: [body.folder]
		}
	})

	return Response.json({
		_id: new ObjectId(),
		...googleDoc.data,
		shortcutDetails: {
			targetId: googleDocsId,
		},
	})
}

export async function DELETE(request, { params }) {	
	console.log('shortcut delete')
	const session = await auth()
	let body = await request.json()

	if (!body.id) {
		Response.json({ })
	}

	const id = body.id
	// console.log('shortcut delete body:', body, session)	
	let account = await fetch(`${process.env.NEXTAUTH_URL}/api/account?id=${session.user_id}`, {
		headers: new Headers(headers()),
	}).then(r => r.json())
	// console.log('shortcut delete account', account)
	// let profile = await fetch(`${process.env.NEXTAUTH_URL}/api/profile?id=${session.user_id}`).then(r => r.json())
	// console.log('shortcut delete profile', profile)


	const oauth2Client = new google.auth.OAuth2(
		process.env.AUTH_GOOGLE_ID, 
		process.env.AUTH_GOOGLE_SECRET
	);

	oauth2Client.setCredentials({
		'access_token': account.access_token,
		'refresh_token': account.refresh_token
	});

	const drive = google.drive({version: 'v3', auth: oauth2Client });

	var googleDoc = await drive.files.delete({
		fileId: id,
	})

	return Response.json(googleDoc)
}