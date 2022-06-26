import { getSession } from "next-auth/react"
import clientPromise from "../../lib/mongodb.js"
let ObjectID = require('mongodb').ObjectID
const {google} = require('googleapis');

export default async function handler(req, res) {
	const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_ID, process.env.GOOGLE_SECRET);
	
	let session = await getSession({ req })

	let mongoClient = await clientPromise
	var db = await mongoClient.db('guitartabimporter')
	var users = await db.collection('users')
	var user = await users.findOne({ email: session.user.email })

	var id = user._id
	var accounts = await db.collection('accounts')
	var account = await accounts.findOne({ userId: id })

	let url = req.query.url
	let folder = req.query.folder

	let response = await fetch(process.env.NEXTAUTH_URL + '/api/tab?url='+url).then(r => r.json())
	console.log(response)
	let artist = response.artist
	let songName = response.songName
	let rawTabs = response.tabs

	oauth2Client.setCredentials({
		'access_token': account.access_token,
		'refresh_token': account.refresh_token
	});

	const docs = google.docs({version: 'v1', auth: oauth2Client });
	const drive = google.drive({version: 'v3', auth: oauth2Client });

	console.log('Importing: ' + songName + ' by ' + artist);

	try {
		var googleDoc = await drive.files.create({
			resource: { 
				name: '[DRAFT] ' + artist + ' - ' + songName, //+ ' {' + uri + '}',
				mimeType: 'application/vnd.google-apps.document',
				parents: [req.query.folder]
			}
		})

		const requests = [
			// {
			// 	'createHeader': {
			// 		type: 'DEFAULT',
			// 	},
			// },
			{
				'updateDocumentStyle': {
					'documentStyle': {
						'marginTop': {
							'magnitude': 20,
							'unit': 'PT'
						},
						'marginBottom': {
							'magnitude': 20,
							'unit': 'PT'
						},
						'marginLeft': {
							'magnitude': 50,
							'unit': 'PT'
						},
						'marginRight': {
							'magnitude': 20,
							'unit': 'PT'
						},
						'defaultHeaderId': {

						}
					},
					'fields': 'marginTop,marginLeft,marginBottom,marginRight'
				}
			},{
				'insertTable': {
					rows: 1,
					columns: 1,
					endOfSegmentLocation: {
						segmentId: ''
					}
				}
			},{
				'insertText': {
					'text': '_Content_',
					location: {
						index: 5
					}
				},
			},{
				'insertText': {
					'text': "-----------------------------------------------------------------------------\u000b_Artist_ - _Song_\u000b----------------------------------------------------------------------------",
					location: {
						index: 1
					}
				}
			},{
				'updateTextStyle': {
					'range': {
						startIndex: 1,
						endIndex: 188
					},
					textStyle: {
						weightedFontFamily: {
							fontFamily: 'PT Mono'
						},
						fontSize: {
							magnitude: 9,
							unit: 'PT'
						}
					},
					fields: 'weightedFontFamily,fontSize'
				}
			},{
				'updateParagraphStyle': {
					paragraphStyle: {
						alignment: 'CENTER'
					},
					'range': {
						startIndex: 1,
						endIndex: 170
					},
					fields: 'alignment'
				}
			},{
					'replaceAllText': { 
						'replaceText' : artist,
						'containsText': {
							'text' : '_Artist_',
							'matchCase' : true
						}
					}
			},{
					'replaceAllText': { 
						'replaceText' : songName,
						'containsText': {
							'text' : '_Song_',
							'matchCase' : true
						}
					} 
			},{                   
				'replaceAllText': { 
					'replaceText' : rawTabs,
					'containsText': {
						'text' : '_Content_',
						'matchCase' : true
					}
				}

			// },{                    
			// 	'replaceAllText': { 
			// 		'replaceText' : uri,
			// 		'containsText': {
			// 			'text' : '_spotifyUri_',
			// 			'matchCase' : true
			// 		}
			// 	}
		}]

		console.log('updating doc')
		var googleDocUpdated = await docs.documents.batchUpdate({
			'documentId': googleDoc.data.id,
			'resource' : { 
				'requests': requests 
			}
		})
		// res.redirect('https://docs.google.com/document/d/' + googleDoc.data.id)
		res.send({
			artist: artist,
			songName: songName,
			googleUrl: 'https://docs.google.com/document/d/' + googleDoc.data.id
		})

	}
	catch(err) {
		console.log(err)
		if (err.code == 401 || err.code == 400) {
			console.log('Refresh?')
			let extraParams = { 
				client_id: process.env.GOOGLE_ID, 
				client_secret: process.env.GOOGLE_SECRET, 
				refresh_token: account.refresh_token,
				grant_type: 'refresh_token',
			}

			// Request refresh token
			let response = await fetch('https://www.googleapis.com/oauth2/v4/token', { 
					method: 'POST',
					body: JSON.stringify(extraParams)
			 }).then(r => r.json())
			console.log(response)

			// set new access token in DB
			
    }
	}

}