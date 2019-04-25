const scraper = require("./scraper");
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.file', 
'https://www.googleapis.com/auth/drive.readonly',
'https://www.googleapis.com/auth/documents.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), importDoc);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function importDoc(auth) {	
	url = process.argv.slice(2)[0]
	console.log('url: ' + url)
	if (typeof url === 'undefined'){
		console.log('No URL provided.')
		return;
	}
	var tab, artist, song_name, raw_tabs;
	scraper.getSong(url, function() {
		tab = arguments[0];
		artist = tab.artist;
		song_name = tab.song_name;
		// console.log(tab.raw_tabs)
		raw_tabs = formatRawTabs(tab.raw_tabs);
		console.log(raw_tabs)
	    console.log('Importing: ' + song_name + ' by ' + artist);
		
		const docs = google.docs({version: 'v1', auth});
		const drive = google.drive({version: 'v3', auth})
		// console.log(auth)
		var copyId;
		drive.files.copy({
			'fileId': '1K7dvZpTODZcfwxcLEsFJVCJhxaaO0_HfZBUn5rKcE3M',
			'resource': { 'name': '[DRAFT] ' + song_name + ' - ' + artist}
		}, (err, res) => {
			if (err) {
				console.log(err)
				return console.log('The API returned an error while copying the template: ' + err);
			}
			copyId = res.data.id;
			console.log('Copy id: ' + copyId)
			docs.documents.get({
				'documentId': copyId,
			}, (err, res) => {
				if (err) return console.log('The API returned an error while getting the document: ' + err);
				// console.log(res.data.body.content)
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
							'replaceText' : song_name,
							'containsText': {
								'text' : '_Song_',
								'matchCase' : true
							}
						} 
					}, {					
						'replaceAllText': { 
							'replaceText' : raw_tabs,
							'containsText': {
								'text' : '_Content_',
								'matchCase' : true
							}
						}
					}]
				docs.documents.batchUpdate({
					'documentId': copyId,
					'resource' : { 
						'requests': requests 
					}
				}, (err, res) => {
					// console.log(res)
					if (err) return console.log('The API returned an error while updating the document: ' + err);
				})
			});
		})
	});	
}

function formatRawTabs(raw_tabs) {
	//Remove [ch][/ch] around chords
	raw_tabs = raw_tabs.replace(/(\[ch\]|\[\/ch\])/g, '');
	//Remove anything before an [Intro] tag
	raw_tabs = raw_tabs.replace(/[\s\S]*?(?=\n.*?\[intro\])/i, '');
	//Remove ellipses
	raw_tabs = raw_tabs.replace(/(\.\.\.|…)/g, ' ');
	//Remove [Intro], [Verse], etc
	raw_tabs = raw_tabs.replace(/(\[(intro|verse[s]?|chorus|bridge|outro|hook|instrumental|interlude)\ ?\d?\]\n?)/gi, '');
	// Remove periods, question marks, and commas
	raw_tabs = raw_tabs.replace(/(\?|,|\.)/g, '');
	return raw_tabs;
}