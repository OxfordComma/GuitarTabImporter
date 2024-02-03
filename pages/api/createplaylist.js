import { getSession } from "next-auth/react"
import clientPromise from "../../lib/mongodb.js"
let ObjectID = require('mongodb').ObjectID
// const {google} = require('googleapis');
var SpotifyWebApi = require('spotify-web-api-node');


async function getUser(userId, provider) {
    let mongoClient = await clientPromise
    var db = await mongoClient.db('tabr')
    var cl = await db.collection('accounts')

    var user = await cl.findOne({ userId: ObjectID(userId), provider: provider})
    return user

}

export default async function handler(req, res) {
    let mongoClient = await clientPromise
    var db = await mongoClient.db('tabr')
    var cl = await db.collection('projects')

    let session = await getSession({ req })
    let {
        tabs, projectId, userId
    } = JSON.parse(req.body)

    let playlistId
    // let tabs = body.tabs
    // let projectId = body.projectId
    // let userId = body.userId

    // if (!req.query.projectid) {
    //     res.send(402)
    // }

    let project = await cl.findOne({ 
        id: projectId
    })

    var user = await getUser(userId, 'spotify')
    console.log({
        project: project,
        user: user,
    })

    // var user = await cl.findOne({ userId: ObjectID(session.userId), provider: 'spotify' })

    var spotifyAuth = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_ID,
        clientSecret: process.env.SPOTIFY_SECRET
    })    

    spotifyAuth.setAccessToken(user.access_token)
    spotifyAuth.setRefreshToken(user.refresh_token)


    if (new Date() > new Date(user['expires_at'])) {
        console.log('(Playlist) Refreshing access token...', user)
        let refresh = await spotifyAuth.refreshAccessToken()
            .then(async r => {
                console.log('Access token refreshed:', r)
                spotifyAuth.setAccessToken(r.body['access_token'])
                let mongoClient = await clientPromise
                var db = await mongoClient.db('tabr')
                var cl = await db.collection('accounts')
                var user = await cl.updateOne({ 
                    _id: ObjectID(userId) 
                }, {'$set':{ 
                    'access_token': r.body['access_token'],
                    'expires_at': new Date(new Date().setHours(new Date().getHours() + 1))
                }
            })
            console.log('user update:', user)

        }).catch(err => console.log('auth error:' , err))
    }

    
    // Search URIs
    // console.log('tabs:', tabs)
    let uris = []
    let removeUris = []
    await Promise.all(
        tabs
            .sort((a, b) => a['artistName']+a['songName'] < b['artistName']+a['songName'] ? -1 : 1)
            .map(tab => { 
            // new Promise((resolve, reject) => {
            let searchTerm = `track:${tab.songName.replace(/'/, '')} artist:${tab.artistName}`
            console.log('Searching for ', searchTerm)
            return spotifyAuth.searchTracks(searchTerm).then(searchResult => {
                // console.log('searchResult:', searchResult)

                let tracks = searchResult.body.tracks.items
                if (tracks.length == 0)
                    return;

                let track = tracks[0]
                console.log('track:', track['uri'])

                uris.push(track['uri'])
                // return track['id']
            })
            
        })
    )
    console.log(uris)



    console.log(project)
    console.log('spotifyPlaylistId' in project)

    if ('spotifyPlaylistId' in project && project['spotifyPlaylistId']) {
        playlistId = project.spotifyPlaylistId
        let playlist = await spotifyAuth.getPlaylist(playlistId).then(res => res.body).catch(e => console.log(e))
        let options = { limit: 50, offset: 0 }
        let allTracks = []
        let playlistTracks
        while (options.offset == 0 || playlistTracks?.body.next) {
            playlistTracks = await spotifyAuth.getPlaylistTracks(playlistId, options).catch(e => console.log(e))
            let tracks = playlistTracks.body.items.map(i => i.track)
            allTracks.push(tracks)
            options.offset = options.offset+options.limit
        }

        let currentTracks = allTracks.flat()
        let currentUris = currentTracks.map(t => t.uri)
        console.log('current uris:', currentUris)

        // these come as URIs now to lower message size
        let newUris = uris//body.playlist.trackUris//tracks.map(t => t.uri)
        console.log('new uris:', newUris)

        let toBeAdded = newUris.filter(u => !currentUris.includes(u))
        console.log('to be added:', toBeAdded)
        let toBeRemoved = currentUris.filter(u => !newUris.includes(u))
        console.log('to be removed:', toBeRemoved)

        uris = toBeAdded
        removeUris = toBeRemoved
    }
    else {
        let playlist = await spotifyAuth.createPlaylist(project.name, { public: false })
            .then(function(data) {
                // console.log('Created playlist:', data);
                return data.body
            }, function(err) {
                console.log('Something went wrong!', err);
        });
        playlistId = playlist.id
    }



    

    

    // Add tracks to the playlist
    // 100 at a time
    if (uris.length > 0 ) { 
        for (var i = 0; i <= uris.length; i = i+100) {
            let tracks = await spotifyAuth.addTracksToPlaylist(playlistId, uris.slice(i, i+100).map(t => t))
                .then(function(data) {
                    // console.log('Added tracks to playlist:', data);
                    return data.body
                }, function(err) {
                    console.log('Something went wrong!', err);
                })
        }
    }

    if (removeUris.length > 0) {
        for (var i = 0; i <= uris.length; i = i+100) {
            let tracks = await spotifyAuth.removeTracksFromPlaylist(playlistId, removeUris.slice(i, i+100).map(tbr => { return { uri: tbr }}) )
                .then(function(data) {
                    // console.log('Added tracks to playlist:', data);
                    return data.body
                }, function(err) {
                    console.log('Something went wrong!', err);
                })
        }
    }

    res.status(200).json({
        id: playlistId
    })
}