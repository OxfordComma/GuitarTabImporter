const express = require('express')
const router = express.Router()
const passport = require('passport')
const path = require('path')

const {google} = require('googleapis');
const scraper = require('../scraper.js')
const parseTab = require('../parseTab.js')


router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../guitarTabImporter.html'))
});

router.get('/auth/google', (req, res) => {
    console.log(req.query.url)
    const authenticator = passport.authenticate('google-drive', {
    scope: ['https://www.googleapis.com/auth/drive.file', 
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/documents.readonly'],
    state: req.query.url
    })
    authenticator(req, res);
});
router.get('/auth/google/callback',
    passport.authenticate('google-drive', {
        failureRedirect: '/'
    }),
    (request, response) => {
        url = request.query.state
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({
            'access_token': request.user.token,
            'refresh_token': request.user.refresh_token
        });

        const docs = google.docs({version: 'v1', auth: oauth2Client});
        const drive = google.drive({version: 'v3', auth: oauth2Client});

        var tab, artist, song_name, raw_tabs, copyId;
        scraper.getSong(url).then((tab) => {
            artist = tab.artist;
            song_name = tab.song_name;
            raw_tabs = parseTab.formatRawTabs(tab.raw_tabs);
            console.log('Importing: ' + song_name + ' by ' + artist);

            // var copyId;
            drive.files.copy({
                'fileId': '1K7dvZpTODZcfwxcLEsFJVCJhxaaO0_HfZBUn5rKcE3M',
                'resource': { 'name': '[DRAFT] ' + song_name + ' - ' + artist}
            }, (err, res) => {
                if (err) {
                    return console.log('The API returned an error while copying the template: ' + err);
                }
                copyId = res.data.id;
                console.log('Copy id: ' + copyId)
                docs.documents.get({
                    'documentId': copyId,
                }, (err, res) => {
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
                        if (err) return console.log('The API returned an error while updating the document: ' + err);
                        response.redirect('https://docs.google.com/document/d/' + copyId);

                    })
                });
            })
        });
    });

module.exports = router;
