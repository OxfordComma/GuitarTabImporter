import Header from '../components/Header.js'

import styles from '../styles/profile.module.css'
import { useSession } from "next-auth/react"
import { useState, useEffect } from 'react'

export default function Profile(props) {
  const { data: session, status } = useSession()

  let [folder, setFolder] = useState('')
  let [projectsFolder, setProjectsFolder] = useState('')
  

  useEffect(() => {
  	async function updateFolders() {
  		let user = await fetch('/api/user').then(r => r.json())
	  	console.log('user:', user)

	  	setFolder(user.folder ?? '')
	  	setProjectsFolder(user.projectsFolder ?? '')
		}

  	updateFolders();
  	
	}, [])

  
  let onSubmit = async function(event, folder, projectsFolder) {
  	event.preventDefault()
  	let userUpdate = await fetch('/api/user', { 
  		method: 'POST',
  		body: JSON.stringify({
  			email: session.user.email,
  			folder: folder,
  			projectsFolder: projectsFolder,
  		})
  	}).then(r => r.json())

  	console.log(userUpdate)
  }


	return (
		<div className={styles['container']}>
			<div className={styles['window']}>
				<div>
					<label htmlFor="folder">Folder:</label>
					<input type="text" name="folder" id="folder" value={folder} onChange={e => setFolder(e.target.value)}/>
				</div>
				<div>
					<label htmlFor="projects-folder">Projects Folder:</label>
					<input type="text" name="projects-folder" id="projects-folder" value={projectsFolder} onChange={e => setProjectsFolder(e.target.value)}/>
				</div>
				<div>
					<button onClick={e => onSubmit(e, folder, projectsFolder)}>save</button>
				</div>
			</div>
				{/*<form className={styles.column} onSubmit={e => onSubmit(e, folder)}>
					<span>
						<input type="submit" hidden/>
						<label htmlFor="url">Folder:</label>
						<input type="text" name="folder" id="folder" required="required" autocomplete="off" value={folder} onChange={e => setFolder(e.target.value)}/>
					</span>
					<span>
						<button type='submit'>submit</button>
					</span>
				</form>*/}
			
		</div>)
}

