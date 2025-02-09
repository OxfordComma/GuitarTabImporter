import { getSession } from 'next-auth/react';
import { getToken } from 'next-auth/jwt';
var SpotifyWebApi = require('spotify-web-api-node');

import { auth } from 'auth'
import { ObjectId } from 'mongodb'


// So we can delay between requests. Maybe not good practice, will work to remove
const delay = ms => new Promise(res => setTimeout(res, ms));

export async function POST(request, { params }) {   
    let {
        tabs, name, description, playlistId, userId
    } = await request.json()

    // let playlistId

    // let project = await fetch(`${process.env.NEXTAUTH_URL}/api/project?id=${projectId}`).then(r => r.json())
    let user = await fetch(`${process.env.NEXTAUTH_URL}/api/account?id=${userId}&provider=spotify`).then(r => r.json())

    var spotifyAuth = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    })    

    spotifyAuth.setAccessToken(user.access_token)
    spotifyAuth.setRefreshToken(user.refresh_token)

    // Search URIs
    // let uris = []
    // let removeUris = []
    let searchDelay = 3500;
    let numSearches = 25;

    let toBeAdded, toBeRemoved

    // if ('spotifyPlaylistId' in project && project['spotifyPlaylistId']) {
    if (playlistId) {
        // playlistId = project.spotifyPlaylistId
        let playlist = await spotifyAuth.getPlaylist(playlistId).then(res => res.body).catch(e => console.log(e))
        console.log('existing playlist', playlist)
        
        // console.log('existing playlist', {
        //     playlist,
        //     existingTracks,
        //     existingTabs,
        //     searchTabs,
        // })

        // let newName, newDescription
        let newPlaylistDetails = { }
        if (playlist.name !== name) {
            newPlaylistDetails['name'] = name
        }
        if (playlist.description !== '') {
            newPlaylistDetails['description'] = description
        }
        if ('name' in newPlaylistDetails || 'description' in newPlaylistDetails) {
            spotifyAuth.changePlaylistDetails(playlistId, newPlaylistDetails )
        }
        

        // let options = { limit: 50, offset: 0 }
        // let allTracks = playlist.tracks.items

        // let playlistTracks
        // while (options.offset == 0 || playlistTracks?.body.next) {
        //     playlistTracks = await spotifyAuth.getPlaylistTracks(playlistId, options).catch(e => console.log(e))
        //     let tracks = playlistTracks.body.items.map(i => i.track)
        //     allTracks.push(tracks)
        //     options.offset = options.offset+options.limit
        // }
        let playlistTracks = playlist.tracks.items
        let nextTracks = ""
        let totalTracks = playlist.tracks.total
        let offset = playlist.tracks.offset
        let limit = playlist.tracks.limit
        do {
            let nextTracksResponse = await spotifyAuth.getPlaylistTracks(playlistId, {
                limit: 100,
                offset: offset + limit
            })
            // console.log('nextTrackResponse', nextTracksResponse)
            playlistTracks = playlistTracks.concat(nextTracksResponse.body.items)
            nextTracks = nextTracksResponse.body.next
            offset = nextTracksResponse.body.offset
            limit = nextTracksResponse.body.limit
        }
        while (nextTracks)

        let currentTracks = playlistTracks.flat()
        // console.log('current tracks:', currentTracks, playlistTracks) 
        let currentUris = currentTracks.map(t => t.track.uri)
        console.log('current uris:', currentUris)

        let formatExistingTab = (t) => `${t.artistName} - ${t.songName}`
            .toLowerCase()
            .replaceAll(/[^A-Za-z0-9 -]/ig, '')
            .replaceAll(/  +/ig, ' ')
            .trim()
            
        let formatSpotifyTab = (t) => `${t.track.artists[0].name} - ${t.track.name }`
            .toLowerCase()
            .replaceAll(/[^A-Za-z0-9 -]/ig, '')
            .replaceAll(/  +/ig, ' ')
            .trim()

        let existingTabs = currentTracks.map(formatSpotifyTab)
        // console.log('existing tabs', existingTabs)//.slice(0, 5))
        // let allTabs = tabs.map(formatExistingTab)
        let searchTabs = tabs.filter(t => !(
            existingTabs.includes(formatExistingTab(t)) || 
            existingTabs.some(et => et.includes(formatExistingTab(t)))
        ))
        // console.log('search tabs', searchTabs.map(t => { return { artistName: t.artistName, songName: t.songName, formatted: formatExistingTab(t) }}))//.slice(0, 5))
        console.log(`stats: all tabs: ${tabs.length}, existing tabs: ${existingTabs.length}, search tabs: ${searchTabs.length}`)


        // Search for track URIs
        let searchedTracks = []
        for (let i = 0; i <= searchTabs.length; i+=numSearches) {
            console.log('searching for', i, searchTabs.length)
            await Promise.all(
                searchTabs
                    .slice(i, i+numSearches)
                    .sort((a, b) => a['artistName']+a['songName'] < b['artistName']+a['songName'] ? -1 : 1)
                    .map(tab => {
                        let searchTerm = `track:${tab.songName.replace(/'/, '')} artist:${tab.artistName}`
                        console.log('Searching for ', searchTerm)
                        return spotifyAuth.searchTracks(searchTerm, { limit: 1 }).then(searchResult => {
                            let tracks = searchResult.body.tracks.items
                            if (tracks.length == 0)
                                return;
    
                            let track = tracks[0]
                            // console.log('track:', track['uri'])
                            searchedTracks.push(track)
                        })
                    })
            )
            await delay(searchDelay)
        }
        let uris = searchedTracks.map(t => t.uri)
        console.log('searched uris:', uris)
        // these come as URIs now to lower message size
        let newUris = uris
        // console.log('new uris:', newUris)


        toBeAdded = newUris.filter(u => !currentUris.includes(u))
        console.log('to be added:', toBeAdded)

        let removedTracks = currentTracks
            .filter(ct => !(
                tabs.map(formatExistingTab).includes(formatSpotifyTab(ct)) || 
                tabs.some(t => formatSpotifyTab(ct).includes(formatExistingTab(t) ))
            ) )
        console.log('removed tracks: ', removedTracks.map(formatSpotifyTab))
        toBeRemoved = removedTracks.map(t => t.track.uri)
        console.log('to be removed:', toBeRemoved)
    }
    else {
        let playlist = await spotifyAuth.createPlaylist(name, { description: '', public: false })
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
    if (toBeAdded.length > 0 ) { 
        for (var i = 0; i <= toBeAdded.length; i = i+100) {
            console.log('adding tracks', toBeAdded.slice(i, i+100))
            let tracks = await spotifyAuth.addTracksToPlaylist(playlistId, toBeAdded.slice(i, i+100).map(t => t))
                .then(function(data) {
                    // console.log('Added tracks to playlist:', data);
                    return data.body
                }, function(err) {
                    console.log('Something went wrong!', err);
                })
        }
    }

    // if (toBeRemoved.length > 0) {
    //     for (var i = 0; i <= toBeRemoved.length; i = i+100) {
    //         let tracks = await spotifyAuth.removeTracksFromPlaylist(playlistId, toBeRemoved.slice(i, i+100).map(tbr => { return { uri: tbr }}) )
    //             .then(function(data) {
    //                 // console.log('Added tracks to playlist:', data);
    //                 return data.body
    //             }, function(err) {
    //                 console.log('Something went wrong!', err);
    //             })
    //     }
    // }

    return Response.json({
        id: playlistId
    })
}
