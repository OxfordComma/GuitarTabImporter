'use client'
import React from 'react'
import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react"

export const TabsContext = createContext([]);

export function Context({ children }) {
    const session = useSession()

	const [userTabs, setUserTabs] = useState([])
	const [googleTabs, setGoogleTabs] = useState([])

	const [projects, setProjects] = useState([])
	const [openProjectId, setOpenProjectId] = useState(null) 

	const [googleAccount, setGoogleAccount] = useState(undefined)

	function sortTabs(tabs, sortBy) { 
	  let sortedTabs = tabs.slice(0).sort((a, b) => {
	  	let sortBySplit = sortBy.split(' ')
	  	let sortByColumn = sortBySplit[0]
	  	let ascending = true

	  	if (sortBy.includes('descending')) {
	  		ascending = false
	  	}
	    if (sortBy.includes('artist') ) {
	      sortByColumn = 'artistName'
	    }
	    let aSortBy = a[sortByColumn]
	    let bSortBy = b[sortByColumn]

	    if (['artistName', 'songName', 'tuning', 'capo'].includes(sortByColumn)) {
			aSortBy = aSortBy?.toString().toLowerCase().replace(/^the /mi, '') ?? null
			bSortBy = bSortBy?.toString().toLowerCase().replace(/^the /mi, '') ?? null
	    }
	    if (['createdTime'].includes(sortByColumn)) {
	    	aSortBy = new Date(aSortBy)
	    	bSortBy = new Date(bSortBy)
	    }

	    let ascendingTrue = (ascending ? 1 : -1)
	    let ascendingFalse = ascendingTrue * -1

	    let result = aSortBy > bSortBy ? ascendingTrue : ascendingFalse
	    // console.log(aSortBy, bSortBy, result)

	    if (aSortBy == null )
	    	return 1

	    if (bSortBy == null )
	    	return -1

	    return result
	  })
	  // console.log('sorted tabs by:', sortBy, sortedTabs)
	  return sortedTabs
	}

	function formatFolderContents(fc, user) {
		let _id = fc['_id']
		let draft = fc['name'].match('[DRAFT]') == null
		let holiday = fc['name'].match('[HOLIDAY]') == null
		let artistName = fc['name'].split(' - ')[0]
			.replace('\[DRAFT\] ', '')
			.replace('\[HOLIDAY\] ', '')
		let uri = fc['name'].match('\{(.+)\}')
		// To avoid repeating the regex
		if (uri) uri = uri[1]
		let songName = fc['name'].split(' - ')[1].replace(`\{${uri}\}`, '') 
		let googleDocsId = fc.id
		// let googleDocsId = fc.shortcutDetails?.targetId !== undefined ? 
		// 	fc.shortcutDetails.targetId : 
		// 	undefined


		return {
			// id: Math.random().toString(16).slice(2),
			_id: _id,
			googleDocsId: googleDocsId,
			userId: user?._id,
			tabText: '',
			name: fc['name'],
			draft: draft,
			holiday: holiday,
			artistName: artistName,
			uri: uri,
			songName: songName,
			createdTime: new Date(fc.createdTime),
			starred: fc['starred'],
			capo: 0,
			tuning: 'EADGBe',
		}
	} 

	function loadUserTabs() {
		if (userTabs.length == 0) {
			fetch(`/api/tabs?userid=${session.data.user_id}`)
			  .then(r => r.json())
			  .then(newUserTabs => { 
				setUserTabs(newUserTabs)
			})
		  }
	}

	function loadGoogleTabs() {
		fetch(`/api/profile?id=${session.data.user_id}`)
			.then(r => r.json())
			.then(profile => {
				fetch('/api/folder?id=' + profile.libraryFolder)
					.then(r => r.json())
					.then(newGoogleTabs => {            
						newGoogleTabs = newGoogleTabs.map(formatFolderContents)
						setGoogleTabs(newGoogleTabs)
					})
			}) 
	}

	const value = {
		userTabs, setUserTabs, loadUserTabs,
		googleTabs, setGoogleTabs, loadGoogleTabs,
		projects, setProjects,
		openProjectId, setOpenProjectId,
		formatFolderContents,
		sortTabs,
		googleAccount,
	}


	useEffect(() => {
		console.log('Context updated:', { 
			userTabs,
			googleTabs,
			projects,
			openProjectId,
			googleAccount
		})
	}, [userTabs, googleTabs, projects, openProjectId, googleAccount ])

	useEffect(() => {
		async function updateAccount() {
			if (session.data?.user_id) {
				let accountResponse = await fetch(`/api/account?id=${session.data.user_id}`).then(r => r.json())
				if (accountResponse) {
					setGoogleAccount(accountResponse)
				}
			}	
		}

  		updateAccount();
	}, [session])

	return (
		<TabsContext.Provider value={value} >
			{children}
		</TabsContext.Provider >
	)
}

