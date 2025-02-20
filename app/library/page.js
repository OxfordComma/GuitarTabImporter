'use client'
import Header from 'components/Header.js'
import Sidebar from 'components/Sidebar.js'
import Editor from 'components/TabEditor.js'
import FullscreenWindow from 'components/FullscreenWindow.js'
import ConfirmDelete from 'components/ConfirmDelete.js'
import EditTabWindow from 'components/EditTabWindow.js'
import EditObjectWindow from 'components/EditObjectWindow.js'
import OpenObjectsWindow from 'components/OpenObjectsWindow'
import { TabsContext } from 'components/Context.js'
import { handleOpenPicker } from 'components/PickerButton.js'

import { MenuBar } from 'quantifyjs'
import menuBarStyles from 'styles/MenuBar.module.css'

import styles from './page.module.css'

import { useSession } from "next-auth/react"
import { useState, useEffect, useContext } from 'react'
import { formatRawTabs, getChordRowRegex } from 'lib/tabhelper.js'
import useDrivePicker from 'react-google-drive-picker'


export default function Library({ }) {
  const session = useSession()
  // console.log('library session', session)
  const [openPicker, authResponse] = useDrivePicker();

  let {
    userTabs, setUserTabs, loadUserTabs,
    googleTabs, setGoogleTabs, loadGoogleTabs,
    sortTabs,
    formatFolderContents,
    // googleAccount,
    profile,
  } = useContext(TabsContext)

  let [sidebarItemId, setSidebarItemId] = useState(null)
  let [tabs, setTabs] = useState([])
  let [user, setUser] = useState(null)
  
  let [deleteTabId, setDeleteTabId] = useState(null)
  let [isNewTab, setIsNewTab] = useState(false)

  let [editObject, setEditObject] = useState(undefined)
  let [openObjects, setOpenObjects] = useState(undefined)


  let [sidebarSortBy, setSidebarSortBy] = useState('lastUpdatedTime descending')
  let [createNewSidebarItem, setCreateNewSidebarItem] = useState(false)
  let [showSidebar, setShowSidebar] = useState(true)
  // let [showSidebarSearchBar, setShowSidebarSearchBar] = useState(false)
  const [columns, setColumns] = useState(1)
  let [action, setAction] = useState(undefined)


  // Fetch user data on startup
  useEffect( () => { 
    if (googleTabs.length === 0) {
      loadGoogleTabs()
    }

    if (userTabs.length === 0) {
      loadUserTabs()
    }
  }, [])

  useEffect( () => {
    let newGoogleTabs = googleTabs.filter(gt => !userTabs.map(t => t.googleDocsId).includes(gt.googleDocsId) )
    let newUserTabs = userTabs
      .map((t, i) => {
        t.index = i
        return t
      })
    let newTabs = sortTabs([
      ...newUserTabs,
      ...newGoogleTabs
    ], sidebarSortBy)

    // console.log('new tabs', newTabs)
    if (newTabs.length > 0) {
      setTabs(
        newTabs
      )
    }
    

  }, [userTabs, googleTabs, sidebarSortBy])
  
  useEffect( () => { 
    // console.log('sidebar item id changed to:', sidebarItemId)
    let tab = userTabs.find(t => t._id === sidebarItemId)
    setColumns(tab?.columns ?? 1)
  }, [userTabs, sidebarItemId] )


  // (artistName, songName, tab.googleDocsId, tabText, createdTime)
  async function addTabMenu(artistName, songName, googleDocsId, tabText, createdTime ) {
    // console.log('adding tab?')

    let newTab = {
      id: Math.random().toString(16).slice(2),
      userId: session.data.user_id,
      googleDocsId: googleDocsId,
      tabText: tabText ?? '',
      // name: artistName + ' - ' + songName,
      artistName: artistName ?? '',
      songName: songName ?? '',
      holiday: false,
      draft: true,
      uri: null,
      createdTime: createdTime ?? new Date(),//.toString(),
      lastUpdatedTime: createdTime ?? new Date(),//.toString(),
      starred: false,
      capo: 0,
      tuning: 'EADGBe',
      bpm: 0,
    }
    
    // setUserTabs([newTab, ...userTabs])
    // setSidebarItemId(newTab._id)
    setEditObject(newTab)
    // setEditTab()
    setIsNewTab(true)
    setAction('edit tab')
    // return newTab._id
  }

  async function importTabMenu() {
    let googleAccount = await fetch(`/api/account?id=${session.data.user_id}`).then(r => r.json())

    console.log('import tab menu:', googleAccount)
    setAction('import tab menu')
    const viewId = "DOCS"
    handleOpenPicker(googleAccount, openPicker, importTab, viewId)
  }

  
  async function importTab(id) {
    let tabText = ''
    console.log('import tab', id )
    let existingTab = tabs.find(t => t['googleDocsId'] == id)
    // let tab = userTabs.find(t => t.googleDocsId == googleDocsId)

    if (existingTab) {
      console.log('tab already exists:', existingTab)
      // return;
    }
    else {
      console.log('create new tab')
    }

    // if (tab && tab.googleDocsId) {
    //   console.log('google doc:', tab)

    let importedTab = await fetch(`api/document?id=${id}`)
      .then(r => r.json())
      // .then(r => r.text)

    console.log('importedTab', importedTab)

    tabText = importedTab.text
  
    // console.log('google doc text:', tabText)
    // }
    // else {
    //   return
    // }

    let title = tabText.match(/-{10,}\r?\n?(.+)\r?\n?-{10,}/)[1]
    // console.log('doc title:', title)
    let artistName = title.split(' - ')[0].trim()
    let songName = title.split(' - ')[1].trim()
    
    tabText = tabText
      .replace(title+'\r\n', '')
      .replace(/-{76,77}\r?\n?/g, '')
      .replace(/^ +$/m, '')
      .replace(/^[\r\n]+/mg, '')
      .replace(/\r(?!\n)/g, '\n')

    let createdTime = new Date()
    if (existingTab && googleTabs.map(t => t['_id']).includes(existingTab['googleDocsId'])) {
      createdTime = googleTabs.find(t => t['_id'] == existingTab['googleDocsId']).createdTime
    }

    if (!(existingTab && userTabs.map(t => t['googleDocsId']).includes(existingTab.googleDocsId) )) {
      console.log('adding tab', existingTab)
      addTabMenu(artistName, songName, id, tabText, createdTime)
    }
    else {
      let newUserTab = userTabs.find(t => t['googleDocsId'] == existingTab['googleDocsId'])
      newUserTab = {
        ...newUserTab,
        artistName: artistName,
        songName: songName,
        tabText: tabText,
      }
      console.log('imported one!', newUserTab)
      // setUserTabs(
      //   userTabs.map(t => t['googleDocsId'] == existingTab['googleDocsId'] ? newUserTab : t)
      // )

      onSaveTab(newUserTab)
    }

  }

  function editTabMenu() {
    setAction('edit tab')
    setEditObject(userTabs.find(t => t._id === sidebarItemId))
  }

  async function exportTab(userTab) {
    let tab
    if (userTab) {
      tab = userTab
    }
    else {
      tab = userTabs.find(t => t['_id'] == sidebarItemId)
    }
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

    return exportResponse
    
    // // if (!tab['googleDocsId']) {
    // tab['googleDocsId'] = exportResponse['id']
    // userTabs = userTabs.map(t => {
    //   if (t['_id'] == sidebarItemId) {
    //     return tab
    //   }
    //   return t
    // })
    // setUserTabs(userTabs)

    // saveTab(tab)

    // setTabs(tabs)
  }

  async function onSaveTab(saveTab) {
    let newUserTab
    if (saveTab === undefined) {
      newUserTab = editObject
    }
    else {
      newUserTab = saveTab
    }
    if (newUserTab === undefined) {
      newUserTab = userTabs.find(t => t['_id'] == sidebarItemId)
    }

    // let userId = session?.data?.user_id
    // if (!userId) return;
   
    setEditObject(undefined)
    console.log('userTab', newUserTab)

    // Last Updated Time
    // if (!newUserTab?.lastUpdatedTime) {
    newUserTab.lastUpdatedTime = new Date()
    // }
    if (!('capo' in newUserTab)) {
      newUserTab['capo'] = 0
    }

    if (!('tuning' in newUserTab)) {
      newUserTab['tuning'] = 'EADGBe'
    }

    if ('draft' in newUserTab) {
      newUserTab['draft'] = ([true, 'true'].includes(newUserTab['draft']))
    }

    if ('holiday' in newUserTab) {
      newUserTab['holiday'] = ([true, 'true'].includes(newUserTab['holiday']))
    }

    if ('starred' in newUserTab) {
      newUserTab['starred'] = ([true, 'true'].includes(newUserTab['starred']))
    }

    let exportResponse = await exportTab(newUserTab)
    newUserTab['googleDocsId'] = exportResponse['id']

    let saveResponse = await fetch('api/tab', {
      method: 'POST',
      body: JSON.stringify(newUserTab)
    }).then(r => r.json())

    // newUserTab = saveResponse
    
    console.log('saveResponse:', saveResponse, userTabs)

    let newUserTabs = userTabs
    // let newGoogleTabs = googleTabs

    if (saveResponse) {
      // exportTab(saveResponse)

      // newUserTab['tabText'] = userTab.tabText
      // newUserTab['_id'] = saveResponse?._id
      if (('_id' in saveResponse) && newUserTabs.map(t => t._id).includes(saveResponse._id)) {
        newUserTabs = newUserTabs.map(t => {
          if (t._id == saveResponse._id) {
            return saveResponse
          }
          return t
        })
      }
      else {
        newUserTabs = [saveResponse, ...newUserTabs]
      }  

      setUserTabs(newUserTabs)
      // setGoogleTabs(newGoogleTabs)
      if (isNewTab) {
        setSidebarItemId(saveResponse._id)
      }
      setIsNewTab(false)
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

  function deleteTabMenu() {
    setAction('delete tab')
    setOpenObjects(tabs)
  }

  async function onDeleteTab(tabId) {
    setAction('confirm delete tab')
    setDeleteTabId(tabId)
  }

  async function onConfirmDeleteTab() {
    // console.log('deleting:', deleteTabId)
    const deleteTab = userTabs.find(t => t._id == deleteTabId)
    fetch(`/api/tab?id=${deleteTabId}`, {
      method: 'DELETE',
    }).then(r => r.json())

    setUserTabs(
      userTabs.filter(t => t._id != deleteTabId)
    )
    setDeleteTabId(null)
    setAction(undefined)
  }

  async function toggleColumnsMenu() {
    let newUserTabs = userTabs
    newUserTabs = newUserTabs.map(t => {
      return t._id === sidebarItemId ? {
        ...t,
        columns: t?.columns ? 
          t.columns === 1 ? 
            2 : 1
          : 1
      } : t
    })

    // setColumns(parseInt(newUserTabs.find(t => t._id === sidebarItemId).columns) ?? 1)
    setUserTabs(newUserTabs)
  }

  function addTabStaffMenu() {
    let tab = userTabs.find(t => t._id === sidebarItemId)
    let staffString = '\n'+
  'e|----------------------------------------------------------------------------------|\n'+
  'B|----------------------------------------------------------------------------------|\n'+
  'G|----------------------------------------------------------------------------------|\n'+
  'D|----------------------------------------------------------------------------------|\n'+
  'A|----------------------------------------------------------------------------------|\n'+
  'E|----------------------------------------------------------------------------------|'
    setUserTabs(userTabs.map(t => t._id === sidebarItemId ? {
      ...tab,
      tabText: tab.tabText + staffString
    } : t))
  }

  function addChordListMenu() {
    let tab = userTabs.find(t => t._id === sidebarItemId)
    let chordRowRegex = getChordRowRegex()
    let rows = tab?.tabText.split(/[\r\n]+/).filter(d => d != '')
    let allChords = []
    console.log('rows', rows)
    rows = rows.filter(r => r.match(chordRowRegex)).map(r => {
      let chords = r.split(' ').filter(d => d != '')
      console.log('adding chords', r, chords)
      allChords.push(chords)
    })
    let allChordsSorted = [...new Set(allChords.flat())]
    console.log('allChordsSorted', allChordsSorted)


    setUserTabs(userTabs.map(t => t._id === sidebarItemId ? {
      ...tab,
      tabText: `${tab.tabText}\n${allChordsSorted.join('    ')}`
    } : t))
  }

  async function createSpotifyPlaylist() {
    console.log('create spotify playlist')
    let profile = await fetch(`api/profile?id=${session.data.user_id}`)
      .then(r => r.json())
    console.log('create spotify profile', profile)

    let spotifyPlaylist = await fetch(`/api/playlist`, {
      method: 'POST',
      body: JSON.stringify({
        userId: session.data.user_id,
        name: 'TABR Library',
        description: '',
        playlistId: profile.spotifyPlaylistId ?? undefined,
        tabs: tabs,
      })
    }).then(r => r.json())

    console.log('create spotify playlist:', spotifyPlaylist)

    let newProfile = {
      ...profile,
      spotifyPlaylistId: spotifyPlaylist.id
    }

    console.log('new profile', newProfile)

    fetch(`api/profile`, { method: 'POST', body: JSON.stringify(newProfile)})
    // setProjects(
    //   projects.map(p => p._id == openProjectId ? newProject : p)
    // )
  }

  function openSpotifyPlaylist() {
    window.open(`https://open.spotify.com/playlist/${profile.spotifyPlaylistId}` )
  }


  function formatTabText() {
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


  return (
    <div className={styles.container}>
      <EditObjectWindow // Edit/Save Tab
        user={user}
        editObject={editObject}
        setEditObject={setEditObject}
        onOpenObject={onSaveTab}
        show={action === 'edit tab'}
        subset={['artistName', 'songName', 'capo', 'tuning', 'bpm', 'columns', 'draft']}
        accessors={{
          columns: d => isNaN(parseInt(d)) ? null : parseInt(d),
        }}
      />
      <OpenObjectsWindow // Delete Tab
        openObjects={openObjects}
        setOpenObjects={setOpenObjects}
        onOpenObject={onDeleteTab}
        show={action === 'delete tab'}
        keyFunction={d => d._id}
        labelFunction={d => `${d['artistName']} - ${d['songName']}` }
      />
      <ConfirmDelete // Confirm Delete Tab
        item={userTabs.find(t => t._id === deleteTabId)}
        action={onConfirmDeleteTab}
        label={'delete'}
        show={action === 'confirm delete tab'} 
        close={()=>setDeleteTabId(null)}
        keyFunction={d => d._id}
      />      
      <div className={styles['content']}>
        <div className={styles['menu-bar']}>
          <MenuBar 
            setEditObject={setEditObject}
            className={styles['menu-bar']} 
            styles={menuBarStyles}
            items={{
              'file': [{
                  title: 'new tab',
                  onClick: () => addTabMenu(),
                },{
                  title: 'import tab',
                  // onClick: () => importTab(sidebarItemId),
                  onClick: () => importTabMenu(),
                  // disabled: (!sidebarItemId),
                },{
                  title: 'edit tab',
                  onClick: () => editTabMenu(),
                  disabled: (!sidebarItemId),
                },{
                  title: 'save tab',
                  onClick: () => onSaveTab(userTabs.find(t => t._id === sidebarItemId)),
                  disabled: (!sidebarItemId),
                },{
                  title: 'update playlist',
                  onClick: () => createSpotifyPlaylist(),
                  // onClick: () => onSaveTab(userTabs.find(t => t._id === sidebarItemId)),
                  // disabled: (!sidebarItemId),
                }, {
                  title: 'open tab',
                  onClick: () => window.open(`https://docs.google.com/document/d/${tabs.find(t => t._id === sidebarItemId).googleDocsId}/edit` ),
                  disabled: !(tabs.find(t => t._id === sidebarItemId) && tabs.find(t => t._id === sidebarItemId).googleDocsId !== null )
                }, {
                  title: 'delete tab',
                  onClick: () => deleteTabMenu(),
                  // disabled: (!sidebarItemId),
                }
              ],
              view: [{
                title: 'two column mode',
                onClick: () => toggleColumnsMenu()
              }],
              tools: [{
                title: 'format tab text',
                onClick: () => formatTabText(),
              }, {
                title: 'add tab staff',
                onClick: () => addTabStaffMenu(),
              }, {
                title: 'add chord list',
                onClick: () => addChordListMenu(),
              }],
              sort: [
                {
                  title: 'sort by artist',
                  onClick: () => sidebarSortBy == 'artist ascending' ? setSidebarSortBy('artist descending') : setSidebarSortBy('artist ascending')
                }, {
                  title: 'sort by song name',
                  onClick: () => sidebarSortBy == 'songName ascending' ? setSidebarSortBy('songName descending') : setSidebarSortBy('songName ascending')
                }, {
                  title: 'sort by created time',
                  onClick: () => sidebarSortBy == 'createdTime descending' ? setSidebarSortBy('createdTime ascending') : setSidebarSortBy('createdTime descending')
                }, {
                  title: 'sort by modified time',
                  onClick: () => sidebarSortBy == 'lastUpdatedTime descending' ? setSidebarSortBy('lastUpdatedTime ascending') : setSidebarSortBy('lastUpdatedTime descending')
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
              sidebar: {
                // title: 'show sidebar',
                onClick: () => setShowSidebar(!!!showSidebar)
              }
              // 'import': [
              //   { 
              //     title: 'import tab from Google Docs', 
              //     // onClick: importTab,
              //     // disabled: (mode=='view' || tab?.['googleDocsId'] == null),
              //   }
              // ],
            }}
          />
          {showSidebar ? <div className={styles['menu-bar-label']} 
            onClick={() => {
              setSidebarSortBy(
                sidebarSortBy.search('asc') > -1 ? 
                  sidebarSortBy.replace('ascending', 'descending')
                  : sidebarSortBy.replace('descending', 'ascending')
              )}
          }>
            {sidebarSortBy ? 
              sidebarSortBy.replace('ascending','▲').replace('descending','▼')
               : null
             }
          </div> : null}
        </div>
        <div className={styles['sidebar']}>
          {showSidebar ? <Sidebar
            sidebarItems={tabs}
            setSidebarItems={() => {}}
            sidebarItemId={sidebarItemId}
            setSidebarItemId={setSidebarItemId}
            keyFunction={d => d._id}
            itemIsEnabled={d => userTabs.map(t => t.googleDocsId).map(t => t).includes(d.googleDocsId)}
            SidebarItemComponent={(datum) => {
              // console.log(datum)
              return (
                <div style={{display: 'flex', flexDirection: 'row', width: '100%', height: '100%',}}>
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
                  {
                    datum?.draft ? 
                      <div style={{ 
                        display: 'block', width: '10px', height: '25px', 
                        backgroundColor: 'yellow', boxSizing: 'border-box', border: '1px solid black',
                        borderRadius: '10px',
                      }}></div> : 
                      null
                  }
                </div>
              )
            }}
          /> : null }
        </div>
        <div className={styles['editor']}>
          <Editor
            tabs={userTabs}
            setTabs={setUserTabs}
            tabId={sidebarItemId}
            keyFunction={d => d._id}
            columns={tabs.find(t => t._id === sidebarItemId)?.columns ?? 1}
          />
        </div>   
      </div>   
    </div>

  )
}

