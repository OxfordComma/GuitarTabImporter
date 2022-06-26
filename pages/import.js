import Header from '../components/Header.js'
import ReactTable from '../components/ReactTable.js'
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

  	let folderContents = await fetch('/api/folder?folder=' + user.folder).then(r => r.json())
  	console.log(folderContents)
		setFolder(user.folder)
		setGoogleDocs(folderContents)
	}, [])

  
  let onSubmit = async function(event, folder, url) {
  	event.preventDefault()
  	let userUpdate = await fetch('/api/user?folder='+folder, { method: 'POST' }).then(r => r.json())
  	console.log(userUpdate)

  	let response = await fetch('/api/create?folder='+folder+'&url='+url).then(r => r.json())
  	console.log(response)
  	setGoogleDocs(googleDocs.concat([response]))
  	// setGoogleDocsUrls(googleDocsUrls.concat(response.googleUrl))
  	// setSongName([response.artist, response.songName].join(' - '))
  }

  const tableOptions = {
		'type': {
			accessor: d => d.name.match(/draft|holiday|template/i),
		},
		// 'name': {
		// 	accessor: d => d.name.replace(/\[(draft|holiday)] /i, ''),
		// },
		'artist': {
			accessor: d => d.name.replace(/\[(draft|holiday|template)] /gi, '').split(' - ')[0],
		},
		'title': {
			accessor: d => d.name.replace(/\{.+}/i, '').split(' - ')[1],
		},
		'uri': {
			accessor: d => d.name.match(/\{(.+)}/, '') ? d.name.match(/\{(.+)}/, '')[1] : ''
		},
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
			<div>
				<ReactTable 
					data={googleDocs}
					options={tableOptions}
					// 'name': { 
					// 	id: 'name',
					// 	accessor: d => d.name, 
					// 	// Cell: d => d3.timeFormat("%Y-%m-%d %H:%M")(new Date(d.row.original.post_time)),
					// 	// width: '2fr',
					// }
					// }}
					// onClickRow={this.onClickRow}
					// keyBy={'_id'}
					sortBy={'name'}
					rowStyle={Object.keys(tableOptions).map(t => (tableOptions[t].width ? tableOptions[t].width : '1fr')).join(' ') + ' !important'}
				/>
			</div>
			{/*<table>
				<thead >
				<th style={{display: 'grid', width: '1200px', gridTemplateColumns: '40% 30% 30%'}}>
					<td>Draft?</td>
					<td>Artist</td>
					<td>Song Name</td>
				</th>
				</thead>
				<tbody>
				{
					googleDocs.map(gd => {
						console.log(gd)
						let artistName = gd.name.split(' - ')[0].replace('[DRAFT] ', '')
						let songName = gd.name.split(' - ')[1]
						console.log(songName)
						let draft = gd.name.search(/DRAFT/) > 0
						songName = songName.split('{')[0]

						return (
							<tr  style={{display: 'grid', width: '1200px', gridTemplateColumns: '40% 30% 30%'}}>
								<td>{draft ? 'DRAFT' : ''}</td>
								<td>{artistName}</td>
								<td>{songName}</td>
							</tr>
							)
					})
				}
				</tbody>
			</table>*/}
			
		</div>)
}

