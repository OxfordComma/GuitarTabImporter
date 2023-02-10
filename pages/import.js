// import Header from '../components/Header.js'
// import styles from '../styles/import.module.css'
// import { useSession } from "next-auth/react"
// import { useState, useEffect } from 'react'
// import tableStyles from '../styles/Table.module.css'

// export default function Import(props) {
//   const { data: session, status } = useSession()

//   let [folder, setFolder] = useState('')
//   let [url, setUrl] = useState('')

//   let [loading, setLoading] = useState(false)
  
//   let [googleDocsUrls, setGoogleDocsUrls] = useState([])
//   let [songName, setSongName] = useState('')
  
//   let [googleDocs, setGoogleDocs] = useState([])


//   useEffect(() => {
//   	async function updateFolder() {
//   		let user = await fetch('/api/user').then(r => r.json())
// 	  	// console.log('user:', user)
// 			setFolder(user.folder)
//   	}

//   	updateFolder();
  	
// 	}, [])

  
//   let onSubmit = async function(event, folder, url) {
//   	setLoading(true)
//   	event.preventDefault()
//   	// let userUpdate = await fetch('/api/user?folder='+folder, { method: 'POST' }).then(r => r.json())
//   	// console.log(userUpdate)

//   	let user = await fetch('/api/user').then(r => r.json())
//   	// console.log({user: user})

//   	let tab = await fetch('/api/tab?url='+url).then(r => r.json())
// 		// console.log({tab: tab})

// 		let account = await fetch(`/api/account?userid=${user._id}`).then(r => r.json())
// 		// console.log({account: account})


	
// 		let googleDoc = await fetch(
// 			'/api/create?folder=' + folder,
// 			{ method: 'POST', body: JSON.stringify({tab: tab, user: user, account: account}) }
// 		).then(r => r.json())

//   	// console.log({doc: googleDoc})
//   	setGoogleDocs([googleDoc].concat(googleDocs))
//   	// setGoogleDocsUrls(googleDocsUrls.concat(googleDoc.googleUrl))
//   	// setSongName([googleDoc.artist, googleDoc.songName].join(' - '))

//   	setLoading(false)
//   }


// 	return (
// 		<div className={styles.container}>
// 			<form className={styles['import-column']} onSubmit={e => onSubmit(e, folder, url)}>
// 				<span>
// 					<label htmlFor="url">Tab URL:</label>
// 					<input style={{marginLeft: '3px', width: '250px'}}type="text" name="url" id="url" required="required" autocomplete="off" autofocus value={url} width='225px' onChange={e => setUrl(e.target.value)}/>
// 				</span>
// 				<span >
// 					<input type="submit" hidden/>
// 					<label htmlFor="url">Folder:</label>
// 					<input style={{'marginLeft': '18px', width: '250px'}}type="text" name="folder" id="folder" disabled required="required" autocomplete="off" value={folder} width='250px' onChange={e => setFolder(e.target.value)}/>
// 				</span>
// 				<span>
// 					<button type='submit'>submit</button>
// 				</span>
// 			</form>
// 			<div className={styles['import-column']} >
// 				<div>{loading ? 'loading...' : ''}</div>
// 				{googleDocs.map((doc, i) => <a key={doc.googleDocsId} target='_blank' rel='noreferrer' href={doc.googleUrl}>{[doc.artist, doc.songName].join(' - ')}</a>)}
// 			</div>
			
// 		</div>)
// }

