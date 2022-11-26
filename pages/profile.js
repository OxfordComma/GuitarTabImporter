import Header from '../components/Header.js'
import ReactTable from '../components/ReactTable.js'
import styles from '../styles/profile.module.css'
import { useSession } from "next-auth/react"
import { useState, useEffect } from 'react'
// import clientPromise from "../lib/mongodb.js"
import tableStyles from '../styles/Table.module.css'

export default function Profile(props) {
  const { data: session, status } = useSession()

  let [folder, setFolder] = useState('')
  let [url, setUrl] = useState('')
  
  
  let [googleDocs, setGoogleDocs] = useState([])


  useEffect(() => {
  	async function updateFolder() {
  		let user = await fetch('/api/user').then(r => r.json())
	  	console.log('user:', user)

	  // 	let folderContents = await fetch('/api/folder?folder=' + user.folder).then(r => r.json())
	  // 	console.log(folderContents)
			setFolder(user.folder)
			// setGoogleDocs(folderContents)
  	}

  	updateFolder();
  	
	}, [])

  
  let onSubmit = async function(event, folder, url) {
  	event.preventDefault()
  	let userUpdate = await fetch('/api/user?folder='+folder, { method: 'POST' }).then(r => r.json())
  	console.log(userUpdate)

  	// let response = await fetch('/api/create?folder='+folder+'&url='+url).then(r => r.json())
  	// console.log(response)
  	// setGoogleDocs(googleDocs.concat([response]))
  	// setGoogleDocsUrls(googleDocsUrls.concat(response.googleUrl))
  	// setSongName([response.artist, response.songName].join(' - '))
  }


	return (
		<div className={styles.container}>
				<form className={styles.column} onSubmit={e => onSubmit(e, folder, url)}>
					<span>
						<input type="submit" hidden/>
						<label htmlFor="url">Folder:</label>
						<input type="text" name="folder" id="folder" required="required" autocomplete="off" value={folder} onChange={e => setFolder(e.target.value)}/>
					</span>
					<span>
						<button type='submit'>submit</button>
					</span>
				</form>
			
		</div>)
}

