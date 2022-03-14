import Header from '../components/Header.js'
import styles from '../styles/import.module.css'
import { useSession } from "next-auth/react"
import { useState, useEffect } from 'react'
// import clientPromise from "../lib/mongodb.js"

export default function Login(props) {
  const { data: session, status } = useSession()

  let [folder, setFolder] = useState('')
  let [url, setUrl] = useState('')
  // let [googleDocsUrls, setGoogleDocsUrls] = useState([])
  // let [songName, setSongName] = useState('')
  let [googleDocs, setGoogleDocs] = useState([])

  useEffect(async () => {
  	let user = await fetch('/api/user').then(r => r.json())
		setFolder(user.folder)
	}, [])

  
  let onSubmit = async function(event, folder, url) {
  	event.preventDefault()
  	let userUpdate = await fetch('/api/user?folder='+folder, { method: 'POST' }).then(r => r.json())
  	console.log(userUpdate)

  	let response = await fetch('/api/create?folder='+folder+'&url='+url).then(r => r.json())
  	console.log(response)
  	setGoogleDocs(googleDocs.concat(response))
  	// setGoogleDocsUrls(googleDocsUrls.concat(response.googleUrl))
  	// setSongName([response.artist, response.songName].join(' - '))
  }

	return (
		<div className={styles.container}>
			<div id="form">
				<form onSubmit={e => onSubmit(e, folder, url)}>
					<label htmlFor="url">Tab URL:</label>
					<input type="text" name="url" id="url" required="required" autocomplete="off" autofocus value={url} onChange={e => setUrl(e.target.value)}/>
					<input type="submit" hidden/>
					<label htmlFor="url">Folder:</label>
					<input type="text" name="folder" id="folder" required="required" autocomplete="off" value={folder} onChange={e => setFolder(e.target.value)}/>
					<button type='submit'>submit</button>
				</form>
			</div>
			{
				googleDocs.map(gd => 
					<a href={gd.url}>{gd.songName}</a>
				)
			}
			
		</div>)
}

