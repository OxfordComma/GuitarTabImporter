const express = require('express')
const router = express.Router()

const {google} = require('googleapis');
const ugHelper = require('../js/dl/ultimateGuitarHelper.js')
var SpotifyWebApi = require('spotify-web-api-node')


router.get('/', (req, res) => {
	res.render('import')
});

router.get('/tab/data', async (req, res) => {
	console.log('/tab/data')
	var tab = await ugHelper.getSong(req.query.url)
	var tabArtist = tab.artist;
	var tabSongName = tab.song_name;
	var rawTabs = ugHelper.formatRawTabs(tab.raw_tabs);
	console.log(rawTabs)
	res.send(rawTabs)
})

router.get('/tab', async (req, res) => {
	console.log(req.session)

	if (!req.query.url) {
		res.send('No url provided')
	}

	if (!req.session.passport || !req.session.passport.user.google) {
		req.session.return = '/'
		req.session.url = req.query.url
		res.redirect('/auth/googledrive')
	}

	if (req.session.passport && req.session.passport.user.google) {
		req.session.return = ''
		console.log(req.query.url)
		// Get google account so the new tab can be written
		const oauth2Client = new google.auth.OAuth2();

		// Currently tied directly to account
		oauth2Client.setCredentials({
			'access_token': req.session.passport.user.google.accessToken,
			'refresh_token': req.session.passport.user.google.refreshToken
		});


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
	  var uri = spotifySearchResult.uri
		console.log('Importing: ' + songName + ' by ' + artist);


		var googleDoc = await drive.files.create({
			resource: { 
				name: '[DRAFT] ' + artist + ' - ' + songName,
				mimeType: 'application/vnd.google-apps.document',
				parents: ['0B7wQpwvNx4sTUVZKMFFIVFByakE']
			}
		})
		console.log(googleDoc)

	
		const requests = [
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
							'magnitude': 20,
							'unit': 'PT'
						},
						'marginRight': {
							'magnitude': 20,
							'unit': 'PT'
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


		var googleDocUpdated = docs.documents.batchUpdate({
			'documentId': googleDoc.data.id,
			'resource' : { 
				'requests': requests 
			}
		})
	}

	res.redirect('https://docs.google.com/document/d/' + googleDoc.data.id)
	
})

module.exports = router;
