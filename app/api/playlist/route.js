import { getSession } from 'next-auth/react';
import { getToken } from 'next-auth/jwt';
var SpotifyWebApi = require('spotify-web-api-node');

import { auth } from 'auth'
import { ObjectId } from 'mongodb'


// So we can delay between requests. Maybe not good practice, will work to remove
const delay = ms => new Promise(res => setTimeout(res, ms));

const removeSpecialCharacters = str => str.replaceAll(/[-,.]/g, '')

export async function POST(request, { params }) {   
    let {
        tabs, name, description, playlistId, userId
    } = await request.json()
    
    let user = await fetch(`${process.env.NEXTAUTH_URL}/api/account?id=${userId}&provider=spotify`, {
                headers: new Headers(headers()) 
    }).then(r => r.json())

    var spotifyAuth = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    })    

    spotifyAuth.setAccessToken(user.access_token)
    spotifyAuth.setRefreshToken(user.refresh_token)

    // Search URIs
    let searchDelay = 3500;
    let numSearches = 25;

    let toBeAdded = [], toBeRemoved = [], currentPlaylistTracks = [], searchTabs = [], playlistTracks = []

    if (playlistId) {
        let playlist = await spotifyAuth.getPlaylist(playlistId).then(res => res.body).catch(e => console.log(e))
        console.log('existing playlist', playlist)

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
        
        playlistTracks = playlist.tracks.items
        let nextTracks = ""
        // let totalTracks = playlist.tracks.total
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
        
    }
    else {
        let playlist = await spotifyAuth.createPlaylist(name, { description: '', public: false })
            .then(function(data) {
                // console.log('Created playlist:', data);
                return data.body
            }, function(err) {
                // console.log('Something went wrong!', err);
        });
        playlistId = playlist.id

        playlistTracks = []
    }

    currentPlaylistTracks = playlistTracks.flat()
        // console.log('current tracks:', currentTracks, playlistTracks) 
    let currentPlaylistUris = currentPlaylistTracks.map(t => t.track.uri)
    // console.log('current tracks', currentTracks.map(t => t.track.name))
    // console.log('current uris:', currentUris)

    let formatTabIntoTitle = (t) => `${t.artistName} - ${t.songName}`
        .toLowerCase()
        .replaceAll(/[^A-Za-z0-9 -]/ig, '')
        .replaceAll(/  +/ig, ' ')
        .trim()
        
    let formatSpotifyTrackIntoTitle = (t) => `${t.track.artists[0].name} - ${t.track.name }`
        .toLowerCase()
        .replaceAll(/[^A-Za-z0-9 -]/ig, '')
        .replaceAll(/  +/ig, ' ')
        .trim()

    let currentPlaylistTitles = currentPlaylistTracks.map(formatSpotifyTrackIntoTitle)
    // currentPlaylistTitles.map(c => console.log('currentPlaylistTitles', c) )
    // let allTabs = tabs.map(formatExistingTab)

    // Filter out any songs that we can detect are already on the playlist 
    // so we don't have to search them again
    searchTabs = tabs.filter(t => !(
        currentPlaylistTitles.includes(formatTabIntoTitle(t)) || 
        currentPlaylistTitles.some(et => et.includes(formatTabIntoTitle(t)))
    ))
    // console.log('search tabs', searchTabs.map(t => { return { artistName: t.artistName, songName: t.songName, formatted: formatExistingTab(t) }}))//.slice(0, 5))
    console.log(`stats: all tabs: ${tabs.length}, existing tabs: ${currentPlaylistTitles.length}, search tabs: ${searchTabs.length}`)
    // Search for track URIs
    let searchedTracks = []
    for (let i = 0; i <= searchTabs.length; i+=numSearches) {
        console.log('searching for', i, searchTabs.length)
        await Promise.all(
            searchTabs
                .slice(i, i+numSearches)
                .sort((a, b) => a['artistName']+a['songName'] < b['artistName']+a['songName'] ? -1 : 1)
                .map(tab => {
                    let searchTerm = `track:"${tab.songName.replace(/'/, '')}" artist:${tab.artistName}`
                    console.log('Searching for ', searchTerm)
                    return spotifyAuth.searchTracks(searchTerm, { limit: 1 }).then(searchResult => {
                        let tracks = searchResult.body.tracks.items
                        if (tracks.length == 0)
                            return;

                        let track = tracks[0]
                        console.log(`${searchTerm} result:`, 
                            [{track: track}].map(t => { return { artists: t.track.artists.map(a => a.name), name: t.track.name, album: t.track.album.name, formatted: formatSpotifyTrackIntoTitle(t) } })
                        )
                        searchedTracks.push(track)
                    })
                })
        )
        await delay(searchDelay)
    }
    let newUris = searchedTracks.map(t => t.uri)
    console.log('searched uris:', newUris)
    // these come as URIs now to lower message size
    // let newUris = uris
    // console.log('new uris:', newUris)


    toBeAdded = newUris.filter(u => !currentPlaylistUris.includes(u))
    console.log('to be added:', toBeAdded)

    let removedTracks = currentPlaylistTracks
        .filter(ct => !(
            tabs.map(formatTabIntoTitle).includes(formatSpotifyTrackIntoTitle(ct)) || 
            tabs.some(t => formatSpotifyTrackIntoTitle(ct).includes(formatTabIntoTitle(t) ))
        ) )
    console.log('removed tracks: ', removedTracks.map(formatSpotifyTrackIntoTitle))
    toBeRemoved = removedTracks.map(t => t.track.uri)
    console.log('to be removed:', toBeRemoved)


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

    if (toBeRemoved.length > 0) {
        for (var i = 0; i <= toBeRemoved.length; i = i+100) {
            let tracks = await spotifyAuth.removeTracksFromPlaylist(playlistId, toBeRemoved.slice(i, i+100).map(tbr => { return { uri: tbr }}) )
                .then(function(data) {
                    // console.log('Added tracks to playlist:', data);
                    return data.body
                }, function(err) {
                    console.log('Something went wrong!', err);
                })
        }
    }

    return Response.json({
        id: playlistId
    })
}
