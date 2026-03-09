import { getSession } from "next-auth/react"

const { google } = require('googleapis');
import { auth } from "@/lib/auth"; 
import { headers } from "next/headers"

// Update a record at a specific ID
export async function PUT(request, { params }) {
	const body = await request.json()

	const { session, user } = await auth.api.getSession({
		headers: await headers() 
	})

	let profile = await fetch(`${process.env.BETTER_AUTH_URL}/api/profile`, {
		headers: await headers() // Have to pass headers to nested API calls
	}).then(r => r.json())

	if (!('tab' in body)) {
		return Response.json({ error: "No tab in request body." }, { status: 500 });
	}
	if (!('libraryFolder' in profile)) {
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
		// 'refresh_token': account.refresh_token // Not necessary
	});

	const docs = google.docs({ version: 'v1', auth: oauth2Client });
	const drive = google.drive({ version: 'v3', auth: oauth2Client });

	let {
		tabText,
		artistName,
		songName,
		googleDocsId,
		capo,
		tuning,
		bpm,
		draft,
		columns = 1,
		columnSplit,
		columnWidth = 50,
		fontSize = 9,
	} = body.tab

	const documentName = `${(draft ? '[DRAFT] ' : '')} ${artistName} - ${songName}`
	if (columns !== undefined) {
		columns = parseInt(columns)
	}
	let requests = []

	// Remove contents before we start if the doc exists
	if (googleDocsId) {
		var googleDoc = await docs.documents.get({
			documentId: googleDocsId
		})

		var content = googleDoc.data.body.content
		var maxIndex = content.reduce((acc, curr) => curr.endIndex > acc ? curr.endIndex : acc, 0)

		requests = [{
			'deleteContentRange': {
				'range': {
					'startIndex': 1,
					'endIndex': maxIndex - 1,
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
		console.log('google doc created:', googleDoc)

		googleDocsId = googleDoc.data.id
	}


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
							'endIndex': maxHeaderIndex - 1,
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
								magnitude: fontSize,
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
			'resource': {
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
			'resource': {
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
								magnitude: fontSize,
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

	requests = requests.concat([
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
						'magnitude': 0.18 * 72,
						'unit': 'PT'
					},
					marginHeader: {
						'magnitude': 0.13 * 72,
						'unit': 'PT'
					},
				},
				'fields': 'marginTop,marginLeft,marginBottom,marginRight,marginHeader'
			}
		}, {
			'insertTable': {
				rows: 1,
				columns: columns,
				endOfSegmentLocation: {
					segmentId: ''
				}
			}
		}, {
			'updateTableColumnProperties': {
				'tableStartLocation': {
					segmentId: '',
					index: 2,
				},
				'columnIndices': [0],
				'tableColumnProperties': {
					'widthType': 'FIXED_WIDTH',
					'width': {
						'magnitude': 7.5 * ((columns === 2 ? columnWidth : 100) / 100) * 72,
						'unit': 'PT'
					}
				},
				'fields': '*'

			},
		}, {
			'updateTableCellStyle': {
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
					paddingTop: {
						'magnitude': 0.025 * 72,
						'unit': 'PT',
					},
					paddingBottom: {
						'magnitude': 0.025 * 72,
						'unit': 'PT',

					},
					paddingLeft: {
						'magnitude': 0.025 * 72,
						'unit': 'PT',
					},
					paddingRight: {
						'magnitude': 0.025 * 72,
						'unit': 'PT',
					},
				},
				fields: 'borderTop,borderBottom,borderLeft,borderRight,paddingTop,paddingBottom,paddingLeft,paddingRight',
				tableStartLocation: {
					segmentId: '',
					index: 2,
				}
			}
		}, {
			'insertText': {
				'text': headerText,
				location: {
					segmentId: headerId,
					index: 0,
				}
			},
		}])

	if (columns === 2) {
		requests = requests.concat([{
			'insertText': {
				'text': '_RightColumn_',
				location: {
					index: 7
				}
			}
		}])
	}

	requests = requests.concat([
		{
			'insertText': {
				'text': '_LeftColumn_',
				location: {
					index: 5
				}
			},
		}, {
			'insertText': {
				'text': "-----------------------------------------------------------------------------\u000b_Artist_ - _Song_\u000b----------------------------------------------------------------------------",
				location: {
					index: 1
				}
			}
		}, {
			'updateTextStyle': {
				'range': {
					startIndex: 1,
					endIndex: columns === 2 ? 200 : 192
				},
				textStyle: {
					weightedFontFamily: {
						fontFamily: 'PT Mono'
					},
					fontSize: {
						magnitude: fontSize,
						unit: 'PT'
					}
				},
				fields: 'weightedFontFamily,fontSize'
			}
		}, {
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
		}, {
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
		}, {
			'replaceAllText': {
				'replaceText': artistName,
				'containsText': {
					'text': '_Artist_',
					'matchCase': true
				}
			}
		}, {
			'replaceAllText': {
				'replaceText': songName,
				'containsText': {
					'text': '_Song_',
					'matchCase': true
				}
			}
		}, {
			'replaceAllText': {
				'replaceText': columns === 2 ? tabText.split('\n').slice(0, (columnSplit ? columnSplit : tabText.split('\n').length / 2)).join('\n') : tabText,
				'containsText': {
					'text': '_LeftColumn_',
					'matchCase': true
				}
			}
		}])

	if (columns === 2) {
		requests = requests.concat([
			{
				'replaceAllText': {
					'replaceText': tabText.split('\n').slice((columnSplit ? columnSplit : tabText.split('\n').length / 2)).join('\n'),
					'containsText': {
						'text': '_RightColumn_',
						'matchCase': true
					}
				}
			},
			// {
			// 	'updateTableCellStyle' : {
			// 		'tableCellStyle': {
			// 			paddingTop: {
			// 					'magnitude': 0.05 * 72,
			// 					'unit': 'PT',
			// 			},
			// 			paddingBottom: {
			// 				'magnitude': 0.05 * 72,
			// 				'unit': 'PT',

			// 			},
			// 			paddingLeft: {
			// 				'magnitude': 0.05 * 72,
			// 				'unit': 'PT',
			// 			},
			// 			paddingRight: {
			// 				'magnitude': 0.05 * 72,
			// 				'unit': 'PT',
			// 			},
			// 		},
			// 		fields: 'paddingTop,paddingBottom,paddingLeft,paddingRight',
			// 		tableStartLocation: {
			// 			segmentId: '',
			// 			index: 2,
			// 		}
			// 	}
			// }
		])
	}

	// console.log('updating doc')
	let batchUpdateResponse = await docs.documents.batchUpdate({
		'documentId': googleDocsId,
		'resource': {
			'requests': requests
		}
	})

	console.log('batch update response', batchUpdateResponse, batchUpdateResponse.data.replies)

	drive.files.update({
		fileId: googleDocsId,
		requestBody: {
			name: documentName
		}
	})

	return Response.json({
		mimeType: "application/vnd.google-apps.document",
		id: googleDocsId,
		name: `[DRAFT] ${artistName} - ${songName}`,
		starred: false,
		createdTime: new Date,
	})
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
		process.env.AUTH_GOOGLE_CLIENT_ID, 
		process.env.AUTH_GOOGLE_SECRET
	);

	oauth2Client.setCredentials({
		'access_token': account['accessToken'],
		// 'refresh_token': account.refresh_token
	});

	const drive = google.drive({version: 'v3', auth: oauth2Client });

	let {
		googleDocsId
	} = body['record']

	var googleDoc = await drive.files.delete({
		fileId: googleDocsId,
	})

	return Response.json(googleDoc)
}