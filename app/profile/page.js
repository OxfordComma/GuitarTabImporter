'use client'
import { PickerButton } from 'components/PickerButton.js'

import styles from './page.module.css'
import { useState, useEffect } from 'react'
import { useSession } from "next-auth/react"
import { redirect } from 'next/navigation'
import { signInAction } from 'components/SignInSpotify'

export default function Profile(props) {
  const session = useSession()
  // console.log('profile session:', session)

  let [account, setAccount] = useState({ })
  let [profile, setProfile] = useState()
  let [spotifyAccount, setSpotifyAccount] = useState()

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
		async function updateSpotifyAccount() {
			let sessionData = session.data
			if (sessionData.user_id) {
				let spotifyAccountResponse = await fetch(`/api/account?id=${sessionData.user_id}&provider=spotify`, {
    				headers: new Headers(headers()),
				}).then(r => r.json())

				if ('_id' in spotifyAccountResponse) {
					console.log('setSpotifyAccount', spotifyAccountResponse)
					setSpotifyAccount(spotifyAccountResponse)
				}
			}
		}

		updateSpotifyAccount();

	}, [])

	useEffect(() => {
		async function updateAccount() {
			let sessionData = session.data
			// console.log('sessionData', sessionData)
			if (sessionData.user_id) {
				let accountResponse = await fetch(`/api/account?id=${sessionData.user_id}`, {
    				headers: new Headers(headers()),
				}).then(r => r.json())
				// console.log('account:', accountResponse)

				if (accountResponse) {
					// console.log('setAccount', accountResponse)
					setAccount(accountResponse)
				}
			}	
		}

  		updateAccount();
  	
	}, [])





  
  	let onSubmit = async function(event) {
		event.preventDefault()

		if (profile.libraryFolder)  {
			let existingFolders = await fetch(`/api/folder?id=${profile.libraryFolder}`).then(r => r.json())

			console.log('existingFolders', existingFolders)
		}


		// let libraryFolder = existingFolders.find(f => f.name === 'Library' && f.mimeType === 'application/vnd.google-apps.folder')?.id
		// let projectsFolder = existingFolders.find(f => f.name === 'Projects' && f.mimeType === 'application/vnd.google-apps.folder')?.id

		// // Create folders in selected folder
		// if (libraryFolder) {
		// 	// libraryFolder
		// }
		// else {
		//   	let createLibrary = await fetch(`/api/folder`, {
		//   		method: 'POST',
		//   		body: JSON.stringify({
		//   			name: 'Library',
		//   			parent_folder: profile.folder 
		//   		})
		//   	}).then(r => r.json())
		//   	console.log('createLibrary', createLibrary)
		//   	libraryFolder = createLibrary.data.id
		// }

		// // Create folders in selected folder
		// if (projectsFolder) {

		// }
		// else {
		//   	let createProjects = await fetch(`/api/folder`, {
		//   		method: 'POST',
		//   		body: JSON.stringify({
		//   			name: 'Projects',
		//   			parent_folder: profile.folder 
		//   		})
		//   	}).then(r => r.json())
		//   	console.log('createProjects', createProjects)
		//   	projectsFolder = createProjects.data.id
		// }

		// console.log({
		// 	libraryFolder,
		// 	projectsFolder
		// })

		let profileUpdate = await fetch('/api/profile', { 
			method: 'POST',
			body: JSON.stringify({
				id: session.data.user_id,
				// libraryFo/lder: libraryFolder,
				// projectsFolder: projectsFolder,
				...profile
			})
		}).then(r => r.json())

		console.log('profileUpdate', profileUpdate)
	}

  let onPickFolder = async function (folder) {
		setProfile({
			...profile, 
			libraryFolder: folder
		})
  }

  let onPickProjectsFolder = async function (folder) {
	setProfile({
		...profile, 
		projectsFolder: folder
	})
}
  

  let InstrumentSelect = ({ profile, setProfile }) => {
  	const instruments = profile.instruments

  	return (<div id="instrument-select" className={styles['instrument-select']}>
		{
			Object.keys(instruments).map(i => {
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
			})
		}
	</div>)}


	return (
		<div className={styles['container']}>
			{profile ? <div className={styles['window']}>
				<div className={styles['profile-row']}>
					<label className={styles['profile-row-label']} htmlFor="library-folder">Library Folder</label>
					{profile ? (
						profile.libraryFolder ? 
							<input disabled type="text" name="library-folder" id="library-folder" value={profile.libraryFolder}/>
							: null
						) : null
					}
					<PickerButton account={account} profile={profile} onPick={onPickFolder} label={'pick folder'}/>
					{/* <PickerButton account={account} onPick={() => {console.log('add file') } } viewId="DOCS" parent={profile?.folder ?? undefined} label='import document'/> */}
				</div>
				<div className={styles['profile-row']}>
					<label className={styles['profile-row-label']} htmlFor="projects-folder">Projects Folder</label>
					{profile ? (
						profile.projectsFolder ? 
							<input disabled type="text" name="projects-folder" id="projects-folder" value={profile.projectsFolder}/>
							: null
						) : null
					}
					<PickerButton account={account} profile={profile} onPick={onPickProjectsFolder} label={'pick folder'}/>
					{/* <PickerButton account={account} onPick={() => {console.log('add file') } } viewId="DOCS" parent={profile?.folder ?? undefined} label='import document'/> */}
				</div>
				<div className={styles['profile-row']}>
					<label className={styles['profile-row-label']} htmlFor="instrument-select">Default Instruments</label>
					{
						profile ? (
							profile?.instruments ? 
								<InstrumentSelect
									profile={profile}
									setProfile={setProfile}
								/> : null 
						) : null
					}
				</div>
				<div>
					<button onClick={() => {
						if (spotifyAccount) {
							// signOutAction();
							// signInAction();
							console.log('spotifyAccount', spotifyAccount)
						}
						else {
							signInAction();
						}
					}}>{spotifyAccount ? `Sign Out of Spotify` : `Sign In with Spotify`}</button>
				</div>
				<div>
					<button onClick={onSubmit}>save</button>
				</div>
			</div> : <div>Loading...</div>}
		</div>)
}

