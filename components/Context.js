import React from 'react'
import { createContext, useContext, useState, useEffect } from "react";

export const TabsContext = createContext([]);

export function Context({ children }) {

  const [userTabs, setUserTabs] = useState([])
  const [googleTabs, setGoogleTabs] = useState([])

  const [projects, setProjects] = useState([])
  const [openProjectId, setOpenProjectId] = useState(null) 

  function sortTabs(tabs, sortBy) { 
	  let sortedTabs = tabs.slice(0).sort((a, b) => {
	  	let sortBySplit = sortBy.split(' ')
	  	let sortByColumn = sortBySplit[0]
	  	let ascending = true
	  	// console.log({
	  	// 	sortBySplit,
	  	// 	sortByColumn,
	  	// 	ascending
	  	// })

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
	  console.log('sorted tabs by:', sortBy, sortedTabs)
	  return sortedTabs
	}

	function formatFolderContents(fc, user) {
    let draft = fc['name'].match('[DRAFT]') == null
    let holiday = fc['name'].match('[HOLIDAY]') == null
    let artistName = fc['name'].split(' - ')[0]
      .replace('\[DRAFT\] ', '')
      .replace('\[HOLIDAY\] ', '')
    let uri = fc['name'].match('\{(.+)\}')
    // To avoid repeating the regex
    if (uri) uri = uri[1]
    let songName = fc['name'].split(' - ')[1].replace(`\{${uri}\}`, '') 
    let googleDocsId = fc.shortcutDetails?.targetId != undefined ? 
      fc.shortcutDetails.targetId : 
      fc.id


    return {
      id: Math.random().toString(16).slice(2),
      googleDocsId: googleDocsId,
      userId: user?._id,
      tabText: '',
      name: fc['name'],
      draft: draft,
      holiday: holiday,
      artistName: artistName,
      uri: uri,
      songName: songName,
      createdTime: new Date(fc['createdTime']),
      starred: fc['starred'],
      capo: 0,
      tuning: 'EADGBe',
    }
  } 

  const value = {
  	userTabs, setUserTabs, 
  	googleTabs, setGoogleTabs,
  	projects, setProjects,
  	openProjectId, setOpenProjectId,
  	formatFolderContents,
  	sortTabs,
  }

  // useEffect(() => {
  	
  // }, [])

  useEffect(() => {
  	console.log('Context updated:', { 
  		userTabs,
  		googleTabs,
  		projects,
  		openProjectId,
  	})
  }, [userTabs, googleTabs, projects, openProjectId, ])

  return (
   	<TabsContext.Provider value={value} >
    	{children}
 		</TabsContext.Provider >
  )
}

