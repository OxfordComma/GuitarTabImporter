import Header from '../../components/Header.js'
import styles from '../../styles/profile.module.css'
import Editor from '../../components/TabEditor.js'


import { useSession } from "next-auth/react"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Tab() {
  const { data: session, status } = useSession()

  let [folder, setFolder] = useState('')
  let [url, setUrl] = useState('')
  let [tab, setTab] = useState(null)
  
  
  // let [googleDocs, setGoogleDocs] = useState([])

  const router = useRouter()
  console.log(router.query);
  console.log(router.query.tabId);



  useEffect(() => {
  	// async function updateFolder() {
  		// let user = await fetch('/api/user').then(r => r.json())
	  	// console.log('user:', user)

	  // 	let folderContents = await fetch('/api/folder?folder=' + user.folder).then(r => r.json())
	  // 	console.log(folderContents)
			// setFolder(user.folder)
			// setGoogleDocs(folderContents)
  	// }

  	async function getTab() {
  		if (!router.query.tabId)
  			return
  		
  		console.log('fetching ',router.query.tabId)
  		let tabResponse = await fetch('/api/tab?tabid='+router.query.tabId).then(r => r.json())
  		console.log('tab:', tabResponse)
  		setTab(tabResponse)
  	}

  	// updateFolder();
  	
  	getTab();
  	
	}, [router.query.tabId])

	// if (!router.query.tabId)
  	// return <div></div>


  
  // let onSubmit = async function(event, folder, url) {
  	// event.preventDefault()
  	// let userUpdate = await fetch('/api/user?folder='+folder, { method: 'POST' }).then(r => r.json())
  	// console.log(userUpdate)

  	// let response = await fetch('/api/create?folder='+folder+'&url='+url).then(r => r.json())
  	// console.log(response)
  	// setGoogleDocs(googleDocs.concat([response]))
  	// setGoogleDocsUrls(googleDocsUrls.concat(response.googleUrl))
  	// setSongName([response.artist, response.songName].join(' - '))
  // }


	return (
		<div className={styles.container}>
			<Editor
				sidebarItemId={tab?.id}
				// userId={user?._id}
				tabs={tab ? [tab] : []}
				// setTabs={setProjects}
			/>	
		</div>)
}

