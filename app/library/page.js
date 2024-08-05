'use client'
import Header from 'components/Header.js'
import Sidebar from 'components/Sidebar.js'
import Editor from 'components/TabEditor.js'
import FullscreenWindow from 'components/FullscreenWindow.js'
import ConfirmDelete from 'components/ConfirmDelete.js'
import EditTabWindow from 'components/EditTabWindow.js'
import EditObjectWindow from 'components/EditObjectWindow.js'
import { TabsContext } from 'components/Context.js'

import { MenuBar } from 'quantifyjs'
import menuBarStyles from 'styles/MenuBar.module.css'

import styles from './page.module.css'

import { useSession } from "next-auth/react"
import { useState, useEffect, useContext } from 'react'
import { formatRawTabs } from 'lib/tabhelper.js'




export default function Library({ }) {
  const session = useSession()

  let [tabs, setTabs] = useState([])

  let {
    userTabs, setUserTabs,
    googleTabs, setGoogleTabs,
    sortTabs,
    formatFolderContents,
  } = useContext(TabsContext)

  let [sidebarItemId, setSidebarItemId] = useState(null)
  let [user, setUser] = useState(null)
  
  let [editTab, setEditTab] = useState(null)
  let [deleteTabId, setDeleteTabId] = useState(null)
  let [isNewTab, setIsNewTab] = useState(false)

  let [editObject, setEditObject] = useState(undefined)


  let [sidebarSortBy, setSidebarSortBy] = useState('createdTime descending')
  let [createNewSidebarItem, setCreateNewSidebarItem] = useState(false)
  let [showSidebarSearchBar, setShowSidebarSearchBar] = useState(false)

  // Fetch user data on startup
  useEffect( () => {
    async function getData() {
      // let user = await fetch('/api/user').then(r => r.json())
      // console.log('session:', session)
      // setUser(user)

      // Saved to database
      if (session?.data?.user_id && userTabs.length == 0) {
        fetch('/api/tabs?userid=' + session.data.user_id)
          .then(r => r.json())
          .then(newUserTabs => { 
            console.log('userTabs:', newUserTabs)
            setUserTabs(newUserTabs)
        })
      }

      // In user's GDrive folder
      if (googleTabs.length == 0 ) { 
        setGoogleTabs([])
        // fetch('/api/folder?folder=' + user.folder)
        //   .then(r => r.json())
        //   .then(newGoogleTabs => {
        //     setGoogleTabs(newGoogleTabs)
        // })
      }    
    }

    getData()
  }, [] )

  useEffect( () => {
    let googleTabsWithMetadata = googleTabs.map(g => formatFolderContents(g, user))
    // console.log('googleTabsWithMetadata', googleTabsWithMetadata)

    let userGoogleDocsIds = userTabs.map(t => t.googleDocsId).map(t => t)
    let filteredGoogleTabs = googleTabsWithMetadata.filter(g => !userGoogleDocsIds.includes(g.googleDocsId) || g==null )
    let allTabs = [...userTabs.reverse(), ...filteredGoogleTabs]

    // console.log('all tabs:', {
    //   userTabs,
    //   googleTabsWithMetadata,
    //   userGoogleDocsIds,
    //   filteredGoogleTabs,
    //   allTabs,
    // })

    allTabs = allTabs.map((at, i) => {
      at['index'] = i
      return at
    })

    allTabs = sortTabs(allTabs, sidebarSortBy)
    // console.log('allTabs:', allTabs)
    setTabs(allTabs)

  }, [userTabs, googleTabs, sidebarSortBy])

  // useEffect( () => { 
  //   // console.log('sidebar item id changed to:', sidebarItemId)
  // }, [sidebarItemId] )



  async function addTab(googleDocsId=null, tabText='', createdTime=new Date() ) {
    // console.log('adding tab?')

    let newTab = {
      id: Math.random().toString(16).slice(2),
      userId: session.data.user_id,
      googleDocsId: googleDocsId,
      tabText: tabText,
      // name: artistName + ' - ' + songName,
      artistName: '',
      songName: '',
      holiday: false,
      draft: false,
      uri: null,
      createdTime: createdTime,//.toString(),
      lastUpdatedTime: createdTime,//.toString(),
      starred: false,
      capo: 0,
      tuning: 'EADGBe',
      bpm: 0,
    }
    
    setUserTabs([newTab, ...userTabs])
    setSidebarItemId(newTab._id)
    setEditObject(newTab)
    // setEditTab()
    // setIsNewTab(true)
    return newTab._id
  }
  

  async function importTab() {
    let tabText = ''
    let tab = tabs.find(t => t['_id'] == sidebarItemId)

    if (tab.googleDocsId) {
      tabText = await fetch('api/document?documentid='+tab.googleDocsId)
        .then(r => r.json())
    
      console.log('google doc text:', tabText)
    }

    let title = tabText.match(/-{10,}\r?\n?(.+)\r?\n?-{10,}/)[1]
    console.log('doc title:', title)
    let artistName = title.split(' - ')[0]
    let songName = title.split(' - ')[1]
    
    tabText = tabText
      .replace(title+'\r\n', '')
      .replace(/-{76,77}\r?\n?/g, '')
      .replace(/^ +$/m, '')
      .replace(/^[\r\n]+/mg, '')

    let createdTime = new Date()
    if (googleTabs.map(t => t['_id']).includes(tab['googleDocsId'])) {
      createdTime = googleTabs.find(t => t['_id'] == tab['googleDocsId']).createdTime
    }

    if(!userTabs.map(t => t['googleDocsId']).includes(tab.googleDocsId)) {
      console.log('adding tab', tab)
      addTab(artistName, songName, tab.googleDocsId, tabText, createdTime)
    }
    else {
      let newUserTab = userTabs.find(t => t['googleDocsId'] == tab['googleDocsId'])
      newUserTab = {
        ...newUserTab,
        artistName: artistName,
        songName: songName,
        tabText: tabText,
      }
      console.log('Caught one!', newUserTab)
      setUserTabs(
        userTabs.map(t => t['googleDocsId'] == tab['googleDocsId'] ? newUserTab : t)
      )

      saveTab(newUserTab)
    }

  }


  async function exportTab() {
    let tab = userTabs.find(t => t['_id'] == sidebarItemId)
    // let sidebarTab = tab
    console.log('exporting:', tab)
    // let user = await fetch('api/user').then(r => r.json())
    // let userId = user._id
    // let account = await fetch(`/api/account?userid=${userId}`).then(r => r.json())

    let exportResponse = await fetch(`api/document`, {
      method: 'POST',
      body: JSON.stringify({
        tab: tab,
        // account: account,
        // folder: user.folder,
      })
    }).then(r => r.json())  

    console.log('exportResponse:', exportResponse)
    // if (!tab['googleDocsId']) {
    tab['googleDocsId'] = exportResponse['id']
    userTabs = userTabs.map(t => {
      if (t['_id'] == sidebarItemId) {
        return tab
      }
      return t
    })
    setUserTabs(userTabs)

    // saveTab(tab)

    // setTabs(tabs)
  }

  async function saveTab(userTab) {
    if (userTab == undefined) {
      userTab = userTabs.find(t => t['_id'] == sidebarItemId)
    }
    // Remove _id field for saving to database

    let userId = session?.data?.user_id
    if (!userId) return;

    let newUserTab = userTab
    // if (newUserTab && newUserTab._id) {
    //   delete newUserTab._id
    // }
    console.log('userTab', newUserTab, sidebarItemId)

    // Last Modified Time
    newUserTab['lastUpdatedTime'] = new Date()

    let saveResponse = await fetch('api/tab', {
      method: 'POST',
      body: JSON.stringify(newUserTab)
    }).then(r => r.json())
    
    console.log('saveResponse:', saveResponse)

    let newUserTabs = userTabs
    // let newGoogleTabs = googleTabs

    if (saveResponse) {
      exportTab()

      // newUserTab['tabText'] = userTab.tabText
      // newUserTab['_id'] = saveResponse?._id

      newUserTabs = newUserTabs.map(t => {
        if (t._id == newUserTab._id) {
          return newUserTab
        }
        return t
      })

      setUserTabs(newUserTabs)
      // setGoogleTabs(newGoogleTabs)
    }

    // If it hasn't been saved to Google yet, save it
    // if (!newUserTab?.googleDocsId || newUserTab.googleDocsId == null) {
    //   console.log('exporting new tab to docs:', newUserTab)

    //   let account = await fetch(`/api/account?userid=${userId}`).then(r => r.json())

    //   let newGoogleTab = await fetch(`api/create`, {
    //     method: 'POST',
    //     body: JSON.stringify({
    //       tab: newUserTab,
    //       account: account,
    //       folder: user.folder,
    //     })
    //   }).then(r => r.json())  

    //   console.log('new google tab:',  newGoogleTab)

    //   newGoogleTabs = [newGoogleTab, ...googleTabs]

    //   newUserTabs = newUserTabs.map(t => {
    //     if (t.id == newUserTab.id) {
    //       t['googleDocsId'] = newGoogleTab['id']
    //     }
    //     return t
    //   })

    // }
  }

  let deleteTab = async () => {
    let tab = tabs.find(t => t._id == deleteTabId)
    let deletedTab = await fetch(`/api/tab?id=${deleteTabId}`, {
      method: 'DELETE',
    }).then(r => r.json())

    console.log('deleted:', deletedTab)
    console.log('updating this tab:', tab)
    
    setUserTabs(
      userTabs.filter(t => t._id != deleteTabId)
    )

    setDeleteTabId(null)
  }


 return (
    <div className={styles.container}>
      <ConfirmDelete 
        show={deleteTabId != null} 
        item={tabs.find(t => t._id === deleteTabId)}
        action={deleteTab}
        label={'delete'}
        close={()=>setDeleteTabId(null)}
      />
      <EditObjectWindow
        user={user}
        editObject={editObject}
        setEditObject={setEditObject}
        show={editObject ?? false}
        subset={['artistName', 'songName', 'capo', 'tuning', 'bpm']}
        save={saveTab}
      />
      <div className={styles['library-menu-bar']}>
        <MenuBar 
          setEditObject={setEditObject}
          className={styles['library-menu-bar']} 
          styles={menuBarStyles}
          items={{
            'file': [{
                title: 'new tab',
                onClick: () => addTab(),
              },{
                title: 'edit tab',
                onClick: () => setEditObject(tabs.find(t => t._id === sidebarItemId)),
              },{
                title: 'save tab',
                onClick: () => saveTab(tabs.find(t => t._id === sidebarItemId)),
              }, {
                title: 'delete tab',
                onClick: () => setDeleteTabId(sidebarItemId)
              }
            ],
            format: [{
              title: 'format tab text',
              onClick: () => {
                console.log('format', userTabs, sidebarItemId)
                setUserTabs(userTabs.map(t => {
                  if (t._id === sidebarItemId) {
                    return {
                      ...t, 
                      tabText: formatRawTabs(t.tabText)
                    }
                  }
                  return t
                }))
              }
            }],
            'import': [
              { 
                title: 'import tab from Google Docs', 
                // onClick: importTab,
                // disabled: (mode=='view' || tab?.['googleDocsId'] == null),
              }
            ],
          }}
        />
      </div>
        <div className={styles['sidebar']}>
          <Sidebar
            sidebarItems={tabs}
            setSidebarItems={setTabs}
            sidebarItemId={sidebarItemId}
            setSidebarItemId={setSidebarItemId}
            SidebarItemComponent={(datum) => {
              return (
                <div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%',}}>
                  <div style={{
                    width: '100%',
                  }}>
                    {datum.songName}
                  </div>
                  <div style={{
                    width: '100%',
                    fontSize: '0.8em'
                  }}>
                    {datum.artistName}
                  </div>
                </div>
              )
            }}
          />
        </div>
        <div className={styles['editor']}>
          <Editor
            tabs={tabs}
            setTabs={setTabs}
            tabId={sidebarItemId}
          />
        </div>      
    </div>
  )
}

