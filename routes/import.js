const express = require('express')
const router = express.Router()

const {google} = require('googleapis');
const ugHelper = require('../js/dl/ultimateGuitarHelper.js')
const SpotifyWebApi = require('spotify-web-api-node')
const refresh = require('passport-oauth2-refresh');


router.get('/', (req, res) => {
	// Check authentication
	if (req.session.passport && req.session.passport.user) {
      res.redirect('/import')
  }
  else {
      res.redirect('/auth/googledrive')  	
  }
});

router.get('/import', (req, res) => {
	res.render('import')
})



router.get('/tab', async (req, res) => {
	if (!req.query.url) {
		res.send('No url provided')
	}

	
// console.log(req.query.url)
// Get google account so the new tab can be written
const oauth2Client = new google.auth.OAuth2(process.env.google_client_id, process.env.google_client_secret);

oauth2Client.setCredentials({

	'access_token': req.session.passport.user.accessToken,
	'refresh_token': req.session.passport.user.refreshToken
});

// Spotify to get the URI for the song being imported
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.spotify_client_id,
  clientSecret: process.env.spotify_client_secret
});

await spotifyApi.clientCredentialsGrant().then(data => 
	spotifyApi.setAccessToken(data.body['access_token'])
)

const docs = google.docs({version: 'v1', auth: oauth2Client });
const drive = google.drive({version: 'v3', auth: oauth2Client });


var tab = await ugHelper.getSong(req.query.url)
var tabArtist = tab.artist;
var tabSongName = tab.song_name;
var rawTabs = ugHelper.formatRawTabs(tab.raw_tabs);


var spotifySearchResult = await spotifyApi
	.searchTracks(tabArtist + ' ' + tabSongName)
	.then(song => song.body.tracks.items[0])

console.log(spotifySearchResult)
var artist = spotifySearchResult.artists.map(a => a.name).join(', ')
var songName = spotifySearchResult.name
var uri = spotifySearchResult.uri.replace('spotify:track:', '')

console.log('Importing: ' + songName + ' by ' + artist);

try {
	var googleDoc = await drive.files.create({
		resource: { 
			name: '[DRAFT] ' + artist + ' - ' + songName + ' {' + uri + '}',
			mimeType: 'application/vnd.google-apps.document',
			parents: ['0B7wQpwvNx4sTUVZKMFFIVFByakE']
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

		// var d = await docs.documents.get({
		// 	documentId: googleDoc.data.id}
		// )

		// console.log(d)
		// var headerSegmentId = Object.keys(d.data.headers)[0]

		// googleDocUpdated = await docs.documents.batchUpdate({
		// 	'documentId': googleDoc.data.id,
		// 	resource: {
		// 		requests: [{
		// 			'insertText': {
		// 				'text': uri,
		// 				location: {
		// 					segmentId: headerSegmentId
		// 				}
		// 			},
		// 		},{
		// 			'updateTextStyle': {
		// 				'range': {
		// 					segmentId: headerSegmentId,
		// 					startIndex: 0,
		// 					endIndex: 36
		// 				},
		// 				textStyle: {
		// 					weightedFontFamily: {
		// 						fontFamily: 'PT Mono'
		// 					},
		// 					fontSize: {
		// 						magnitude: 6,
		// 						unit: 'PT'
		// 					}
		// 				},
		// 				fields: 'weightedFontFamily,fontSize'
		// 			}
		// 		}]
		// 	}
		// })

		res.redirect('https://docs.google.com/document/d/' + googleDoc.data.id)
	}
	catch(err) {
		console.log(err)
		if (err.code==401) {
			let extraParams = { client_id: process.env.google_client_id, client_secret: process.env.google_client_secret }
			refresh.requestNewAccessToken('google', req.session.passport.user.google.refreshToken, extraParams, function(err, accessToken) {
        if (err || !accessToken) { return res.status(401).end() }

        // Save the new accessToken for future use
       req.session.passport.user.google.accessToken = accessToken 
     })
    }
	}
})

router.get('/tab/data', async (req, res) => {
	console.log('/tab/data')
	var tab = await ugHelper.getSong(req.query.url)
	var tabArtist = tab.artist;
	var tabSongName = tab.song_name;
	var rawTabs = ugHelper.formatRawTabs(tab.raw_tabs);
	console.log(rawTabs)
	res.send(rawTabs)
})

module.exports = router;
