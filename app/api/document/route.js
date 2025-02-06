import { getSession } from "next-auth/react"

const {google} = require('googleapis');
import { auth } from 'auth'

export async function GET(request, { params }) {
	const session = await auth()

  let account = await fetch(`${process.env.NEXTAUTH_URL}/api/account?id=${session.user_id}`).then(r => r.json())
  // console.log('fetched account', account)
//   let profile = await fetch(`${process.env.NEXTAUTH_URL}/api/profile?id=${session.user_id}`).then(r => r.json())
  // console.log('fetched profile', profile)
  let searchParams = request.nextUrl.searchParams
	console.log('searchParams', searchParams)
  
  if (!searchParams.get('id') ) {
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

	const docs = google.docs({version: 'v1', auth: oauth2Client });
	const drive = google.drive({version: 'v3', auth: oauth2Client });

  const fileExport = await drive.files.export({
  	fileId: searchParams.get('id'),
  	mimeType: 'text/plain'
	}).catch(e => { 
		console.log('error', e.response)
		return e.response
	})

	if (fileExport?.status === 404) { 
		return Response.json({ text: '' }, {status: 404 })
	}
	return Response.json({ 
		text: fileExport.data 
	})

}
// export default async function handler(req, res) {
export async function POST(request, { params }) {
	const session = await auth()
	let body = await request.json()
	// console.log('create body:', body, session)

	
	let account = await fetch(`${process.env.NEXTAUTH_URL}/api/account?id=${session.user_id}`).then(r => r.json())
	// console.log('fetched account', account)
	let profile = await fetch(`${process.env.NEXTAUTH_URL}/api/profile?id=${session.user_id}`).then(r => r.json())
	// console.log('fetched profile', profile)

	if (!body.tab || !profile.libraryFolder) {
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
		draft
	} = body.tab
	
	const documentName = (draft ? '[DRAFT] ' : '') + artistName + ' - ' + songName
	
	let requests = []

	if (googleDocsId) {
		var googleDoc = await docs.documents.get({
			documentId: googleDocsId
		})
		// console.log('document:', googleDoc)
		// console.log('document:', googleDoc.data)
		// console.log('document:', googleDoc.data.body)
		// console.log('document:', googleDoc.data.body.content)
		// console.log('document:', googleDoc.data.body.content)

		var content = googleDoc.data.body.content
		var maxIndex = content.reduce((acc, curr) => curr.endIndex > acc ? curr.endIndex : acc, 0)

		// console.log({
		// 	content, 
		// 	maxIndex
		// })
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
				name: documentName,
				mimeType: 'application/vnd.google-apps.document',
				parents: [profile.libraryFolder]
			}
		})

		googleDocsId = googleDoc.data.id
	}


	try {
		let headerId, headerContent, maxHeaderIndex
		if (googleDoc.data?.headers != undefined) {
			headerId = Object.keys(googleDoc.data.headers)[0]
			headerContent = googleDoc.data.headers[headerId].content
			maxHeaderIndex = headerContent.reduce((acc, curr) => curr.endIndex > acc ? curr.endIndex : acc, 0)


			if (maxHeaderIndex > 2) {
				requests = requests.concat([
				
				{
					'deleteContentRange': {
						'range': {
							'startIndex': 0,
							'endIndex': maxHeaderIndex-1,
							segmentId: headerId,
						}
					},
				},
				{
					'updateTextStyle': {
						'range': {
							startIndex: 0,
							endIndex: 1,
							segmentId: headerId,
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
				},
				])
			}
		}
		else {
			let createHeader = await docs.documents.batchUpdate({
				'documentId': googleDocsId,
				'resource' : { 
					'requests': [{
						"createHeader": {
			        "sectionBreakLocation": {
			          "index": 0
			        },
			        "type": "DEFAULT"
			      }
					}]
				}
			})

			// console.log('create header:', createHeader)
			// console.log('create header:', createHeader.data.replies[0].createHeader.headerId)
			headerId = createHeader.data.replies[0].createHeader.headerId

			await docs.documents.batchUpdate({
				'documentId': googleDocsId,
				'resource' : { 
					'requests': [{
						'updateTextStyle': {
							'range': {
								startIndex: 0,
								endIndex: 1,
								segmentId: headerId,
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
					}]
				}
			})

		}

		let headerText = (capo == '0' && tuning == 'EADGBe') ? ' ' :
			(capo != '0' && tuning != 'EADGBe') ? `${tuning}, capo ${capo}` : 
			(capo != '0') ? `capo ${capo}` : 
			(tuning != 'EADGBe') ? tuning : ' '

		// console.log({
		// 	capo,
		// 	tuning,
		// 	headerText,
		// 	headerContent,
		// 	maxHeaderIndex
		// })

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
					marginHeader: {
						'magnitude': 0.1 * 72,
						'unit': 'PT'
					},
				},
				'fields': 'marginTop,marginLeft,marginBottom,marginRight,marginHeader'
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
			'updateTableCellStyle' : {
				'tableCellStyle': {
					borderTop: {
						width: {
							'magnitude': 0,
							'unit': 'PT',
						},
						dashStyle: 'SOLID',
						color: {
							color: {
								rgbColor: {
									red: 0,
									green: 0,
									blue: 0,
								},
							},
						},
					},
					borderBottom: {
						width: {
							'magnitude': 0,
							'unit': 'PT',
						},
						dashStyle: 'SOLID',
						color: {
							color: {
								rgbColor: {
									red: 0,
									green: 0,
									blue: 0,
								},
							},
						},

					},
					borderLeft: {
						width: {
							'magnitude': 0,
							'unit': 'PT',
						},
						dashStyle: 'SOLID',
						color: {
							color: {
								rgbColor: {
									red: 0,
									green: 0,
									blue: 0,
								},
							},
						},
					},
					borderRight: {
						width: {
							'magnitude': 0,
							'unit': 'PT',
						},
						dashStyle: 'SOLID',
						color: {
							color: {
								rgbColor: {
									red: 0,
									green: 0,
									blue: 0,
								},
							},
						},

					},
				},
				fields: 'borderTop,borderBottom,borderLeft,borderRight',
				tableStartLocation: {
					segmentId: '',
					index: 2,
				}
			}
		},{
			'insertText': {
				'text': headerText,
				location: {
					segmentId: headerId,
					index: 0,
				}
			},
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
			'updateParagraphStyle': {
				paragraphStyle: {
					alignment: 'END'
				},
				'range': {
					startIndex: 1,
					endIndex: 2,
					segmentId: headerId,
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
				'replaceText' : tabText,
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

		// console.log('updating doc')
		var googleDocUpdated = await docs.documents.batchUpdate({
			'documentId': googleDocsId,
			'resource' : { 
				'requests': requests 
			}
		})

		drive.files.update({
			fileId: googleDocsId,
			requestBody: {
				name: documentName
			}
		})

		// console.log('googleDocUpdated', googleDocUpdated)

		return Response.json({
			mimeType: "application/vnd.google-apps.document",
			id: googleDocsId,
			name: `[DRAFT] ${artistName} - ${songName}`,
			starred: false,
			createdTime: new Date,
		})
	}

	catch(err) {
		console.log(err)
		if (err.code == 401 || err.code == 400) {
			console.log('Refresh?')
			let extraParams = { 
				client_id: process.env.AUTH_GOOGLE_ID, 
				client_secret: process.env.AUTH_GOOGLE_SECRET, 
				refresh_token: account.refresh_token,
				grant_type: 'refresh_token',
			}

			// Request refresh token
			let response = await fetch('https://www.googleapis.com/oauth2/v4/token', { 
					method: 'POST',
					body: JSON.stringify(extraParams)
			 }).then(r => r.json())
			// console.log(response)

			// set new access token in DB
			// ???
    }
	}
}