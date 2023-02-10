import { getSession } from "next-auth/react"
import clientPromise from "../../lib/mongodb.js"
let ObjectID = require('mongodb').ObjectID
const {google} = require('googleapis');

export default async function handler(req, res) {
	const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_ID, process.env.GOOGLE_SECRET);

	let body = JSON.parse(req.body)

	let tab = body.tab.tabText
	let artistName = body.tab.artistName
	let songName = body.tab.songName
	let googleDocsId = body.tab.googleDocsId
	let folder = body.folder


	let account = body.account

	// console.log('create body:', body)

	oauth2Client.setCredentials({
		'access_token': account.access_token,
		'refresh_token': account.refresh_token
	});

	const docs = google.docs({version: 'v1', auth: oauth2Client });
	const drive = google.drive({version: 'v3', auth: oauth2Client });

	let requests = []

	if (googleDocsId) {
		var googleDoc = await docs.documents.get({
			documentId: googleDocsId
		})

		var content = googleDoc.data.body.content
		var maxIndex = content.reduce((acc, curr) => curr.endIndex > acc ? curr.endIndex : acc, 0)

		// Remove contents before we start if the doc exists
		requests = [
		{
			'deleteContentRange': {
				'range': {
					'startIndex': 1,
					'endIndex': maxIndex-1,
				}
			}
		}]
	}
	// Otherwise we're good to make a new one
	else {
		var googleDoc = await drive.files.create({
			resource: { 
				name: '[DRAFT] ' + artistName + ' - ' + songName,
				mimeType: 'application/vnd.google-apps.document',
				parents: [folder]
			}
		})

		googleDocsId = googleDoc.data.id
	}

	requests = requests.concat(
		[{
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
					'replaceText' : artistName,
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
				'replaceText' : tab,
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
			}
		])



	try {
		// console.log('updating doc')
		var googleDocUpdated = await docs.documents.batchUpdate({
			'documentId': googleDocsId,
			'resource' : { 
				'requests': requests 
			}
		})

		res.status(200).send({
			artist: artistName,
			songName: songName,
			googleUrl: 'https://docs.google.com/document/d/' + googleDocsId
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
			// ???
    }
	}

}