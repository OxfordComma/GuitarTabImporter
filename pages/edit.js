import Header from '../components/Header.js'
import Sidebar from '../components/Sidebar.js'
import Editor from '../components/TabEditor.js'
import FullscreenWindow from '../components/FullscreenWindow.js'
import ConfirmDelete from '../components/ConfirmDelete.js'
import EditTabWindow from '../components/EditTabWindow.js'
import { TabsContext } from '../components/Context.js'

import { MenuBar } from 'quantifyjs'
import menuBarStyles from '../styles/MenuBar.module.css'

import styles from '../styles/edit.module.css'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useContext } from 'react'


export default function Edit({ }) {
  const { data: session, status } = useSession()

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

  let [sidebarSortBy, setSidebarSortBy] = useState('createdTime descending')
  let [createNewSidebarItem, setCreateNewSidebarItem] = useState(false)
  let [showSidebarSearchBar, setShowSidebarSearchBar] = useState(true)

  // Fetch user data on startup
  useEffect( () => {
    const getData = async () => {
      let user = await fetch('/api/user').then(r => r.json())
      console.log('user:', user)
      setUser(user)

      // Saved to database
      if (userTabs.length == 0) {
        fetch('/api/tabs?userid=' + user._id)
          .then(r => r.json())
          .then(newUserTabs => { 
            console.log('userTabs:', newUserTabs)
            setUserTabs(newUserTabs)
        })
      }

      // In user's GDrive folder
      if (googleTabs.length == 0 ) { 
        fetch('/api/folder?folder=' + user.folder)
          .then(r => r.json())
          .then(newGoogleTabs => {
            setGoogleTabs(newGoogleTabs)
        })
      }    
    }

    getData()
  }, [] )

  useEffect( () => {
    let googleTabsWithMetadata = googleTabs.map(g => formatFolderContents(g, user))
    console.log('googleTabsWithMetadata', googleTabsWithMetadata)

    let userGoogleDocsIds = userTabs.map(t => t.googleDocsId).map(t => t)
    let filteredGoogleTabs = googleTabsWithMetadata.filter(g => !userGoogleDocsIds.includes(g.googleDocsId) || g==null )
    let allTabs = [...userTabs.reverse(), ...filteredGoogleTabs]

    console.log('all tabs:', {
      userTabs,
      googleTabsWithMetadata,
      userGoogleDocsIds,
      filteredGoogleTabs,
      allTabs,
    })

    allTabs = allTabs.map((at, i) => {
      at['index'] = i
      return at
    })

    allTabs = sortTabs(allTabs, sidebarSortBy)
    // console.log('allTabs:', allTabs)
    setTabs(allTabs)

  }, [userTabs, googleTabs, sidebarSortBy])

  useEffect( () => { 
    console.log('sidebar item id changed to:', sidebarItemId)
  }, [sidebarItemId] )

  async function addTab(artistName, songName, googleDocsId=null, tabText='', createdTime=new Date() ) {
    // console.log('adding tab?')

    let newTab = {
      id: Math.random().toString(16).slice(2),
      userId: user._id,
      googleDocsId: googleDocsId,
      tabText: tabText,
      name: artistName + ' - ' + songName,
      artistName: artistName,
      songName: songName,
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
    setSidebarItemId(newTab.id)
    setEditTab()
    setIsNewTab(true)
    return newTab.id
  }
  
  useEffect(() => {
    console.log('is new tab')
    saveTab()
    setIsNewTab(false)
  }, [isNewTab])


  async function importTab() {
    let tabText = ''
    let tab = tabs.find(t => t['id'] == sidebarItemId)

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
    if (googleTabs.map(t => t['id']).includes(tab['googleDocsId'])) {
      createdTime = googleTabs.find(t => t['id'] == tab['googleDocsId']).createdTime
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
    let tab = userTabs.find(t => t['id'] == sidebarItemId)
    // let sidebarTab = tab
    console.log('exporting:', tab)
    // let user = await fetch('api/user').then(r => r.json())
    let userId = user._id
    let account = await fetch(`/api/account?userid=${userId}`).then(r => r.json())

    let exportResponse = await fetch(`api/create`, {
      method: 'POST',
      body: JSON.stringify({
        tab: tab,
        account: account,
        folder: user.folder,
      })
    }).then(r => r.json())  

    console.log('exportResponse:', exportResponse)
    // if (!tab['googleDocsId']) {
    tab['googleDocsId'] = exportResponse['id']
    userTabs = userTabs.map(t => {
      if (t['id'] == sidebarItemId) {
        return tab
      }
      return t
    })
    setUserTabs(userTabs)

    saveTab(tab)

    // setTabs(tabs)
  }

  async function saveTab(userTab) {
    if (userTab == undefined) {
      userTab = userTabs.find(t => t['id'] == sidebarItemId)
    }
    // Remove _id field for saving to database

    let userId = user?._id
    if (!userId) return;

    let newUserTab = userTab
    if (newUserTab && newUserTab._id) {
      delete newUserTab._id
    }

    // Last Modified Time
    newUserTab['lastUpdatedTime'] = new Date()

    console.log('userTab', newUserTab, sidebarItemId)

    // newUserTab['userId'] = userId

    let saveResponse = await fetch('api/tab', {
      method: 'POST',
      body: JSON.stringify(newUserTab)
    }).then(r => r.json())
    
    console.log('saveResponse:', saveResponse)

    let newUserTabs = userTabs
    let newGoogleTabs = googleTabs

    if (saveResponse.ok == 1) {
      newUserTab['tabText'] = userTab.tabText
      newUserTab['_id'] = saveResponse.value?._id ?? saveResponse.lastErrorObject.upserted


      newUserTabs = newUserTabs.map(t => {
        if (t.id == newUserTab.id) {
          return newUserTab
        }
        return t
      })

      // setUserTabs(newUserTabs)
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
    
    setUserTabs(newUserTabs)
    setGoogleTabs(newGoogleTabs)

  }

  let deleteTab = async () => {
    let tab = tabs.find(t => t.id == deleteTabId)
    let deletedTab = await fetch('/api/tab?tabid='+deleteTabId, {
      method: 'DELETE',
    }).then(r => r.json())

    console.log('deleted:', deletedTab)
    console.log('updating this tab:', tab)
    

    setUserTabs(
      userTabs.filter(t => t.id != deleteTabId)
    )

  
    setDeleteTabId(null)
  }


// <div key='capo' title='capo' style={{justifySelf: 'center', alignSelf: 'center'}}>{datum.capo && datum.capo !== 0 ? datum.capo.toString() : null}</div>
//                 <div key='tuning' title='tuning' style={{justifySelf: 'center', alignSelf: 'center'}}>{datum.tuning ? datum.tuning.match(/^(D#|D|E)/m)[0] : null}</div>
//                 <div key='loaded' title='metadata enhanced' style={{justifySelf: 'center', alignSelf: 'center'}}>{datum._id ? '✓' : null}</div>
//                 <div key='docsId' title='saved to Google Drive' style={{justifySelf: 'center', alignSelf: 'center', opacity: datum.googleDocsId==null ? 0 : 1, transition: 'opacity 250ms ease' }}>{'G'}</div>
//                 <div key='delete' title='delete item' style={{justifySelf: 'center', alignSelf: 'center'}} id={datum.id} onClick={e => {e.stopPropagation(); setDeleteTabId(e.target.id)}}>{datum._id ? '♻' : null}</div>

  return (
    <div className={styles.container}>
      <ConfirmDelete 
        show={deleteTabId != null} 
        deleteFrom={tabs} 
        deletedItemId={deleteTabId}
        setDeleteFrom={setTabs}
        // setDeleteTabId={setDeleteTabId}
        close={()=>setDeleteTabId(null)}
        deleteTab={deleteTab}
      />
      <EditTabWindow
        show={sidebarItemId && editTab}
        tabs={userTabs}
        tabId={sidebarItemId}
        setTabs={setUserTabs}
        editTab={editTab}
        setEditTab={setEditTab}
        styles={styles}
        saveTab={saveTab}
      />
      <div className={styles.sidebar}>
        <Sidebar
          sidebarItems={tabs}
          setSidebarItems={setTabs}
          sidebarItemId={sidebarItemId}
          setSidebarItemId={setSidebarItemId}
          // setDeleteTabId={setDeleteTabId}
          createNewSidebarItem={createNewSidebarItem}
          setCreateNewSidebarItem={setCreateNewSidebarItem}
          search={showSidebarSearchBar}
          searchFunction={d => `${d.artistName} - ${d.songName}`}
          itemIsEnabled={d => d?.tabText != ''}
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
          addSidebarItem={addTab}
          menuBar={
            <MenuBar
              items={
                {
                  file: [{
                    title: 'new tab',
                    onClick: () => setCreateNewSidebarItem(true),
                  },{
                    title: 'edit tab',
                    onClick: () => setEditTab(true),
                  },{
                    title: 'save tab',
                    onClick: () => saveTab(),
                  }],
                  sort: [
                    {
                      title: 'sort by artist',
                      onClick: () => sidebarSortBy == 'artist ascending' ? setSidebarSortBy('artist descending') : setSidebarSortBy('artist ascending')
                    }, {
                      title: 'sort by song name',
                      onClick: () => sidebarSortBy == 'songName ascending' ? setSidebarSortBy('songName descending') : setSidebarSortBy('songName ascending')
                    }, {
                      title: 'sort by created date',
                      onClick: () => sidebarSortBy == 'createdTime descending' ? setSidebarSortBy('createdTime ascending') : setSidebarSortBy('createdTime descending')
                    }, {
                      title: 'sort by capo',
                      onClick: () => sidebarSortBy == 'capo descending' ? setSidebarSortBy('capo ascending') : setSidebarSortBy('capo descending')
                    }, {
                      title: 'sort by tuning',
                      onClick: () => sidebarSortBy == 'tuning ascending' ? setSidebarSortBy('tuning descending') : setSidebarSortBy('tuning ascending')
                    }, {
                      title: 'don\'t sort',
                      onClick: () => setSidebarSortBy('index')
                    }
                  ],
                }
              }
              styles={menuBarStyles}
            />
          }
        />
      </div>
      <div className={styles.editor}>
        <Editor
          tabs={tabs}
          setTabs={setTabs}
          saveTab={saveTab}
          tabId={sidebarItemId}
          userId={user?._id}
          importTab={importTab}
          exportTab={exportTab}
        />
      </div>      
    </div>
  )
}

