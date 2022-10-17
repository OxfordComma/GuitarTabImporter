import Header from '../components/Header.js'
import { Table } from 'quantifyjs'
// import ReactTable from '../components/ReactTable.js'
import styles from '../styles/tabs.module.css'
import { useSession } from "next-auth/react"
import { useState, useEffect } from 'react'
// import clientPromise from "../lib/mongodb.js"
import tableStyles from '../styles/Table.module.css'

export default function Tabs(props) {
  const { data: session, status } = useSession()

  let [folder, setFolder] = useState('')
  let [url, setUrl] = useState('')
  
  // let [googleDocsUrls, setGoogleDocsUrls] = useState([])
  // let [songName, setSongName] = useState('')
  
  let [googleDocs, setGoogleDocs] = useState([])


 useEffect(() => {
  	async function updateFolder() {
  		let user = await fetch('/api/user').then(r => r.json())
	  	console.log('user:', user)

	  	let folderContents = await fetch('/api/folder?folder=' + user.folder).then(r => r.json())
	  	console.log(folderContents)
			setFolder(user.folder)
			setGoogleDocs(folderContents)
  	}

  	updateFolder();
  	
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
			Cell: d => <a href={'https://docs.google.com/document/d/' + d.row.original.id} target='blank'>{d.row.original.name.match(/draft|holiday|template/i)}</a>,
		},
		// 'name': {
		// 	accessor: d => d.name.replace(/\[(draft|holiday)] /i, ''),
		// },
		'artist': {
			accessor: d => d.name.replace(/\[(draft|holiday|template)] /gi, '').split(' - ')[0],
			Cell: d => <a href={'https://docs.google.com/document/d/' + d.row.original.id} target='blank'>{d.row.original.name.replace(/\[(draft|holiday|template)] /gi, '').split(' - ')[0]}</a>,
		},
		'title': {
			accessor: d => d.name.replace(/\{.+}/i, '').split(' - ')[1],
			Cell: d => <a href={'https://docs.google.com/document/d/' + d.row.original.id} target='blank'>{d.row.original.name.replace(/\{.+}/i, '').split(' - ')[1]}</a>,
		},
		'uri': {
			accessor: d => d.name.match(/\{(.+)}/, '') ? d.name.match(/\{(.+)}/, '')[1] : '',
			Cell: d => <a href={'https://docs.google.com/document/d/' + d.row.original.id} target='blank'>{d.row.original.name.match(/\{(.+)}/, '') ? d.row.original.name.match(/\{(.+)}/, '')[1] : ''}</a>,
		},
		'link': {
			Cell: d => <a href={'https://docs.google.com/document/d/' + d.row.original.id} target='blank'>link</a>,
			width: '0.5fr'
		}
	}

	return (
		<div className={styles.container}>
				<Table 
					data={googleDocs}
					options={tableOptions}
					styles={tableStyles}
					sortBy={'name'}
					rowStyle={Object.keys(tableOptions).map(t => (tableOptions[t].width ? tableOptions[t].width : '1fr')).join(' ') + ' !important'}
				/>
			
		</div>)
}

