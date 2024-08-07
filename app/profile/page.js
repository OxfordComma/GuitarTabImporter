'use client'
import PickerButton from 'components/PickerButton.js'

import styles from './page.module.css'
import { useState, useEffect } from 'react'
import { useSession } from "next-auth/react"
import { redirect } from 'next/navigation'
// import authConfig from "auth.config"

export default function Profile(props) {
  const session = useSession()
  // console.log('profile session:', session)

  let [account, setAccount] = useState({ })
  let [profile, setProfile] = useState()

  useEffect(() => {
  	async function updateProfile() {
  		let sessionData = session.data
	  		if (sessionData.user_id) {
		  		let profileResponse = await fetch(`/api/profile?id=${sessionData.user_id}`).then(r => r.json())

			  	if (profileResponse) {
			  		setProfile(profileResponse)
			  	}
			  	else {
			  		setProfile({
					  	folder: null,
					  	projectsFolder: null,
					  	libraryFolder: null,
					  	instruments: {
						  	vocals: false,
						  	guitar: false,
						  	bass: false,
						  	drums: false,
						  }
					  })

	  		}
			}	
		}

  	updateProfile();
  	
	}, [])

	useEffect(() => {
  	async function updateAccount() {
  		let sessionData = session.data
  		// console.log('sessionData', sessionData)
	  		if (sessionData.user_id) {
		  		let accountResponse = await fetch(`/api/account?id=${sessionData.user_id}`).then(r => r.json())
			  	// console.log('account:', accountResponse)

			  	if (accountResponse) {
			  		setAccount(accountResponse)
			  	}
			}	
		}

  	updateAccount();
  	
	}, [])

  
  let onSubmit = async function(event) {
  	event.preventDefault()

  	if (!profile.folder) return;

  	let existingFolders = await fetch(`/api/folder?id=${profile.folder}`).then(r => r.json())

  	console.log('existingFolders', existingFolders)
  	let libraryFolder = existingFolders.find(f => f.name === 'Library' && f.mimeType === 'application/vnd.google-apps.folder')?.id
  	let projectsFolder = existingFolders.find(f => f.name === 'Projects' && f.mimeType === 'application/vnd.google-apps.folder')?.id

  	// Create folders in selected folder
  	if (libraryFolder) {
  		// libraryFolder
  	}
  	else {
	  	let createLibrary = await fetch(`/api/folder`, {
	  		method: 'POST',
	  		body: JSON.stringify({
	  			name: 'Library',
	  			parent_folder: profile.folder 
	  		})
	  	}).then(r => r.json())
	  	console.log('createLibrary', createLibrary)
	  	libraryFolder = createLibrary.data.id
  	}

  	// Create folders in selected folder
  	if (projectsFolder) {

  	}
  	else {
	  	let createProjects = await fetch(`/api/folder`, {
	  		method: 'POST',
	  		body: JSON.stringify({
	  			name: 'Projects',
	  			parent_folder: profile.folder 
	  		})
	  	}).then(r => r.json())
	  	console.log('createProjects', createProjects)
	  	projectsFolder = createProjects.data.id
  	}

  	console.log({
  		libraryFolder,
  		projectsFolder
  	})

  	let profileUpdate = await fetch('/api/profile', { 
  		method: 'POST',
  		body: JSON.stringify({
  			id: session.data.user_id,
  			libraryFolder: libraryFolder,
  			projectsFolder: projectsFolder,
  			...profile
  		})
  	}).then(r => r.json())

  	console.log('profileUpdate', profileUpdate)
  }

  let onPickFolder = async function (folder) {
		setProfile({
			...profile, 
			folder: folder
		})
  }

  let InstrumentSelect = ({ profile, setProfile }) => {
  	const instruments = profile.instruments

  	return (<div id="instrument-select" className={styles['instrument-select']}>
  			{Object.keys(instruments).map(i => {
  				let inst = instruments[i]

  				return (
  					<div 
  						key={i}
  						className={inst ? styles['instrument-select-item-selected'] : styles['instrument-select-item']}
  						onClick={() => setProfile({
  							...profile,
  							instruments: {
  								...instruments, 
  								[i]: !inst
								}
  						})}
						>
	  					({i[0]})
	  				</div>
  				) 
  			})}
  		</div>)
  }


	return (
		<div className={styles['container']}>
			{profile ? <div className={styles['window']}>
				<div className={styles['profile-row']}>
					<label className={styles['profile-row-label']} htmlFor="folder">Folder</label>
					{profile ? (
						profile.folder ? 
							<input disabled type="text" name="folder" id="folder" value={profile.folder}/>
							: null
						) : null
					}
					<PickerButton account={account} onPick={onPickFolder}/>
				</div>
				<div className={styles['profile-row']}>
					<label className={styles['profile-row-label']} htmlFor="instrument-select">Default Instruments</label>
					{profile ? (
						profile?.instruments ? 
							<InstrumentSelect
							profile={profile}
							setProfile={setProfile}
						/> : null 
					) : null
				}
				</div>
				<div>
					<button onClick={onSubmit}>save</button>
				</div>
			</div> : <div>Loading...</div>}
		</div>)
}

