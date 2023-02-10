import Header from '../components/Header.js'
import Sidebar from '../components/TabEditorSidebar.js'
import Editor from '../components/TabEditor.js'

import styles from '../styles/edit.module.css'

import { useSession } from "next-auth/react"
import { useState, useEffect } from 'react'

function ConfirmDelete ({ show, tabs, setTabs, tabId, setDeleteTab }) {
	let tab = tabs.find(t => t.id == tabId)

	let deleteTab = async () => {
		let deletedTab = await fetch('/api/tab?tabid='+tabId, {
			method: 'DELETE',
		}).then(r => r.json())

    console.log('deleted:', deletedTab)
		console.log('updating this tab:', tab)
		setDeleteTab(null)
    if (tab.googleDocsId) {
      tab['tabText'] = ''
      tab['_id'] = null

      setTabs(tabs.map(t => t.id == tab.id ? tab : t))
    }
    else {
      setTabs(tabs.filter(t => t.id != tabId))
    }
	}

  return (show ? <div className={styles['confirm-delete']}>
    <div className={styles['confirm-delete-window']}>
      <div style={{opacity: 1}}>Are you sure you want to delete {tab.tabName}?</div>
      <button onClick={() => setDeleteTab(null)}>no</button>
      <button onClick={() => deleteTab(tabId)}>yes</button>
    </div>
  </div> : null)
}

export default function Edit(props) {
  const { data: session, status } = useSession()

  let [folder, setFolder] = useState('')
  let [url, setUrl] = useState('') 
  let [tabs, setTabs] = useState([])
  let [sidebarItemId, setSidebarItemId] = useState(null)
  let [user, setUser] = useState(null)
  let [deleteTab, setDeleteTab] = useState(null)

  useEffect( () => {
  	console.log('delete tab:', deleteTab)
  }, [deleteTab])

  useEffect( () => {
    const getData = async () => {
    let user = await fetch('/api/user').then(r => r.json())
    console.log('user:', user)

    let userTabs = await fetch('/api/tabs?userid=' + user._id).then(r => r.json())
    console.log('userTabs:', userTabs)

    let folderContents = await fetch('/api/folder?folder=' + user.folder).then(r => r.json())
     	folderContents = folderContents.map(fc => {
        let draft = fc['name'].match('[DRAFT]') == null
        let holiday = fc['name'].match('[HOLIDAY]') == null
        let artistName = fc['name'].split(' - ')[0]
          .replace('\[DRAFT\] ', '')
          .replace('\[HOLIDAY\] ', '')
        let uri = fc['name'].match('\{(.+)\}')
        // To avoid repeating the regex
        if (uri) uri = uri[1]
        let songName = fc['name'].split(' - ')[1].replace(`\{${uri}\}`, '')  

        return {
          id: Math.random().toString(16).slice(2),
          googleDocsId: fc['id'],
          userId: user._id,
          tabText: '',
          tabName: fc['name'],
          draft: draft,
          holiday: holiday,
          artistName: artistName,
          uri: uri,
          songName: songName,
          createdTime: new Date(fc['createdTime']),
          starred: fc['starred'],
       }
     	}).filter(fc => !userTabs.map(ut => ut['googleDocsId']).includes(fc['googleDocsId']))

     	console.log('folderContents:', folderContents)

     	let allTabs = [...userTabs, ...folderContents]
     	allTabs = allTabs.map((at, i) => {
      	at['index'] = i
      	return at
     	})
     	console.log('allTabs:', allTabs)
    	
    	setUser(user)
      setTabs(allTabs)
    }

    getData()
  }, [] )

  useEffect( () => { 
  	console.log('sidebar item id changed to:', sidebarItemId)

  }, [sidebarItemId] )


	return (

		<div className={styles.container}>
			<ConfirmDelete 
				show={deleteTab != null} 
				tabs={tabs} 
				setTabs={setTabs}
				tabId={deleteTab}
				setDeleteTab={setDeleteTab}/>
				<div className={styles.sidebar}>
					<Sidebar
						tabs={tabs}
						setTabs={setTabs}
						sidebarItemId={sidebarItemId}
						setSidebarItemId={setSidebarItemId}
						setDeleteTab={setDeleteTab}
					/>
				</div>
				<div className={styles.editor}>
					<Editor
						sidebarItemId={sidebarItemId}
						userId={user?._id}
						tabs={tabs}
						setTabs={setTabs}
					/>
				</div>			
			</div>
		)
}

