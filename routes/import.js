const express = require('express')
const router = express.Router()

const {google} = require('googleapis');
const ugHelper = require('../js/dl/ultimateGuitarHelper.js')
var SpotifyWebApi = require('spotify-web-api-node')


router.get('/', (req, res) => {
	res.render('import')
});


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

		const docs = google.docs({version: 'v1', auth: oauth2Client});
		const drive = google.drive({version: 'v3', auth: oauth2Client});

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

		var copyId;

		drive.files.copy({
			'fileId': '1K7dvZpTODZcfwxcLEsFJVCJhxaaO0_HfZBUn5rKcE3M',
			'resource': { 'name': '[DRAFT] ' + artist + ' - ' + songName}
		}, (err, response) => {
			if (err) {
				console.log(err)
				return console.log('The API returned an error while copying the template: ' + err);
			}
			copyId = response.data.id;
			console.log('Copy id: ' + copyId)
			docs.documents.get({
				'documentId': copyId,
			}, (err, response) => {
				if (err) return console.log('The API returned an error while getting the document: ' + err);
				const requests = [{
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
					}, {                    
						'replaceAllText': { 
							'replaceText' : rawTabs,
							'containsText': {
								'text' : '_Content_',
								'matchCase' : true
							}
						}
					}, , {                    
						'replaceAllText': { 
							'replaceText' : uri,
							'containsText': {
								'text' : '_spotifyUri_',
								'matchCase' : true
							}
						}
					}]
				docs.documents.batchUpdate({
					'documentId': copyId,
					'resource' : { 
						'requests': requests 
					}
				}, (err, response) => {
					if (err) return console.log('The API returned an error while updating the document: ' + err);
					res.redirect('https://docs.google.com/document/d/' + copyId);
					// res.redirect('/')
				})
			});
		})
	}
	
})

module.exports = router;
