const express = require('express')
const router = express.Router()

const {google} = require('googleapis');
const ugHelper = require('../js/dl/ultimateGuitarHelper.js')
const SpotifyWebApi = require('spotify-web-api-node')
const refresh = require('passport-oauth2-refresh');
// const picker = require('google-picker')
const User = require('../models/User')


router.get('/', (req, res) => {
	// console.log(req.session)
	res.render('import', { style: '/stylesheets/style.css', user: req.user })
})

router.get('/user', (req, res) => {
	// const token = req.query.token
	console.log(req.user)
	console.log(req.user.folder)
	res.json({
		email: req.user.email,
		folder: req.user.folder
	})	
})

// router.get('/user/setfolder', async (req, res) => {
// 	// const token = req.query.token
// 	const folder = req.query.folder
// 	// req.session.passport.user.folder = folder
// 	// console.log(req.user)
// 	console.log(folder)
// 	// res.json(req.session.passport.user)	
// 	var updateResponse = await User.updateOne({_id: req.user }, {
//     folder: folder
// 	})
// 	console.log(updateResponse)
// 	res.redirect('/import')
// })


router.get('/tab', async (req, res) => {
	if (!req.query.url) {
		res.send('No url provided')
	}

	if (!req.query.folder || req.query.folder.length != 28) {
		res.send('Bad folder provided')
	}

	console.log(req.session)
	console.log(req.user)
	console.log(req.query)

	var updateResponse = await User.updateOne({_id: req.user }, {
    folder: req.query.folder
	})

	// console.log(req.query.url)
	// Get google account so the new tab can be written
	const oauth2Client = new google.auth.OAuth2(process.env.google_client_id, process.env.google_client_secret);

	let extraParams = { 
		client_id: process.env.google_client_id, 
		client_secret: process.env.google_client_secret 
	}

	// refresh.requestNewAccessToken('google-drive', req.user.refreshToken, extraParams, function(err, accessToken) {
	  // if (err || !accessToken) { 
	  // 	if (err) 
	  // 		console.log(err)
	  // 	req.user.accessToken = accessToken
	  // }

	  // Save the new accessToken for future use
	 // req.session.passport.user.google.accessToken = accessToken 
	// })

	oauth2Client.setCredentials({
		'access_token': req.user.accessToken,
		'refresh_token': req.user.refreshToken
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
		res.redirect('https://docs.google.com/document/d/' + googleDoc.data.id)
	}
	catch(err) {
		console.log(err)
		if (err.code == 401 || err.code == 400) {
			console.log('Refresh?')
			let extraParams = { 
				client_id: process.env.google_client_id, 
				client_secret: process.env.google_client_secret 
			}

			refresh.requestNewAccessToken('google-drive', req.user.refreshToken, extraParams, function(err, accessToken) {
        if (err || !accessToken) { 
        	if (err) 
        		console.log(err)
        	return res.status(401).end() 
        }

        // Save the new accessToken for future use
       req.session.passport.user.google.accessToken = accessToken 
     })
    }
	}
})

// router.get('/tab/data', async (req, res) => {
// 	console.log('/tab/data')
// 	var tab = await ugHelper.getSong(req.query.url)
// 	var tabArtist = tab.artist;
// 	var tabSongName = tab.song_name;
// 	var rawTabs = ugHelper.formatRawTabs(tab.raw_tabs);
// 	console.log(rawTabs)
// 	res.send(rawTabs)
// })

module.exports = router;
