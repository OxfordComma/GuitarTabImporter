'use client'
import Header from 'components/Header.js'
import Sidebar from 'components/Sidebar.js'
import Editor from 'components/TabEditor.js'
import FullscreenWindow from 'components/FullscreenWindow.js'
import ConfirmDelete from 'components/ConfirmDelete.js'
import EditTabWindow from 'components/EditTabWindow.js'
import EditObjectWindow from 'components/EditObjectWindow.js'
import { TabsContext } from 'components/Context.js'
import OpenObjectsWindow from 'components/OpenObjectsWindow'
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
    projects, setProjects,
    openProjectId, setOpenProjectId,
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
  let [showSidebarSearchBar, setShowSidebarSearchBar] = useState(false)


  let [editObject, setEditObject] = useState(undefined)
  let [openObjects, setOpenObjects] = useState(undefined)
  let [tabTextObj, setTabTextObj] = useState({})


  let [showSidebar, setShowSidebar] = useState(true)


  // Fetch user data on startup
  useEffect( () => {
    async function getProjects() {
      if (projects.length == 0 ) {
        let userProjects = await fetch(`/api/projects?userid=${session.data.user_id}`).then(r => r.json())
        // console.log('userProjects:', userProjects)
        setProjects(userProjects)
      }    
    }

    getProjects()
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

  // useEffect(() => {

  // },[])

  // useEffect( () => { 
  //   // console.log('sidebar item id changed to:', sidebarItemId)
  // }, [sidebarItemId] )

  useEffect( () => {
    async function getProjectTabs() {
      let project = projects.find(p => p._id === openProjectId)
      // console.log('getProjectTabs', project, tabs)
      if (project) {
        let folderResponse = await fetch(`/api/folder?id=${project.folder}`).then(r => r.json())
        // console.log('folderResponse:', folderResponse)
        setTabs(folderResponse)
      }    
    }

    getProjectTabs()
  }, [openProjectId] )

  useEffect( () => {
    // console.log('sidebarItemId', sidebarItemId)
    async function getProjectTabText() {
      // let project = projects.find(p => p._id === openProjectId)
      let tab = tabs.find(t => t.id === sidebarItemId)
      // console.log('getProjectTabText', tab,)
      if (tab && !('tabText' in tab) ) {
        let documentResponse = await fetch(`/api/document?id=${tab.shortcutDetails.targetId}`).then(r => r.json())
        // console.log('documentResponse:', documentResponse,)
        setTabs(tabs.map(t => {
          if (t.id === sidebarItemId) {
            let newTab = t
            let tabText = documentResponse.text
            let artistName = t['name'].split(' - ')[0]
            let songName = t['name'].split(' - ')[1]
            let capo = 0
            let tuning = 'eBGDAE'
            
            t.tabText = tabText
              // .replace(tuningRegex, '')
              .replace(`${artistName} - ${songName}`, '')
              .replace(/-{76,77}/g, '')
              .replace(/^[\r\n]+/mg, '')

            // var tuningRegex = new RegExp("((?:[DE]ADGBe)|D#G#C#F#A#[Dd]#)", "g")

            var tuningRegex = /((?:[DE]ADGBe)|D#G#C#F#A#[Dd]#)/g
            if (t.tabText.match(tuningRegex)) {
              console.log('t tuning:', t)
              t.tuning = t.tabText.match(tuningRegex)[0];

              t.tabText = t.tabText.replace(`${t.tuning}`, '')
              t.tabText = t.tabText
            }

            var capoRegex = /([Cc]apo (\d))/ //new RegExp("([Cc]apo (\\d))", "")
            if (t.tabText.match(capoRegex)) {
              t.capo = parseInt( t.tabText.match(capoRegex)[2] );
              console.log('t capo:', t)

              // tab.tabText = tab.tabText.replace(tab.tabText.match(capoRegex)[0], '')
              t.tabText = t.tabText.replace(capoRegex, '')
            }

            if (t.tabText.substr(0, 2).search(/\r/) !== -1 ){
              t.tabText = t.tabText.substr(2)
            }

            // console.log({
            //   newText
            // })

            // let newTab = {
            //   ...t,
            //   tabText: newText,
            // }

            return t
          }

          else {
            return t
          }
          


        }))
        // setTabTextObj({
        //   [tab.id]: documentResponse.text
        // })
      }    
    }

    getProjectTabText()
  }, [sidebarItemId] )



  function openProject() {
    setOpenObjects(projects)
  }

  function onOpenProject(projectId) {
    console.log('onOpenProject', projectId)
    setOpenProjectId(projectId)
    setOpenObjects(undefined)
  }

  
 return (
    <div className={styles.container}>
      <ConfirmDelete 
        // show={deleteTabId != null} 
        // item={tabs.find(t => t._id === deleteTabId)}
        // action={deleteTab}
        label={'delete'}
        // close={()=>setDeleteTabId(null)}
      />
      <OpenObjectsWindow
        openObjects={openObjects}
        setOpenObjects={setOpenObjects}
        // openObjectId={openProjectId}
        // setOpenObjectId={setOpenProjectId}
        // setPickObject={setEditObject}
        onOpenObject={onOpenProject}
        show={openObjects !== undefined}
      />
      <EditObjectWindow
        user={user}
        editObject={editObject}
        setEditObject={setEditObject}
        show={editObject ?? false}
        subset={['artistName', 'songName', 'capo', 'tuning', 'bpm']}
        // save={saveTab}
      />
      <div className={styles['content']}>
        <div className={styles['menu-bar-container']}>
          <MenuBar 
            setEditObject={setEditObject}
            className={styles['menu-bar']} 
            styles={menuBarStyles}
            items={{
              'file': [{
                title: 'open project',
                onClick: () => openProject(),
              // },{
                //   title: 'new tab',
                //   onClick: () => addTab(),
                // },{
                //   title: 'edit tab',
                //   onClick: () => setEditObject(tabs.find(t => t._id === sidebarItemId)),
                // },{
                //   title: 'save tab',
                //   onClick: () => saveTab(tabs.find(t => t._id === sidebarItemId)),
                // }, {
                //   title: 'delete tab',
                //   onClick: () => setDeleteTabId(sidebarItemId)
                }
              ],
              sidebar: {
                // title: 'show sidebar',
                onClick: () => setShowSidebar(!!!showSidebar)
              }
            }}
          />
          <div className={styles['project-name']}>
            {openProjectId ? projects.find(p => p._id === openProjectId).name : 'no open project'}
          </div>
        </div>
        <div className={styles['sidebar']}>
          {showSidebar ? <Sidebar
            sidebarItems={tabs}
            setSidebarItems={setTabs}
            sidebarItemId={sidebarItemId}
            setSidebarItemId={setSidebarItemId}
            searchFunction={d => d.id}
            keyFunction={d => d.id}
            SidebarItemComponent={(datum) => {
              if (!datum) return;

              let artistName = datum['name'].split(' - ')[0]
              let songName = datum['name'].split(' - ')[1]
              return (
                <div style={{
                    display: 'flex', 
                    flexDirection: 'column', 
                    width: '100%',
                    height: '100%',
                  }}>
                  <div style={{
                    width: '100%',
                  }}>
                    {songName}
                  </div>
                  <div style={{
                    width: '100%',
                    fontSize: '0.8em'
                  }}>
                    {artistName}
                  </div>
                </div>
              )
            }}
          /> : null}
        </div>
        <div className={styles['editor']}>
          <Editor
            keyFunction={d=>d.id}
            tabs={tabs}
            setTabs={setTabs}
            tabId={sidebarItemId}
          />
        </div> 
      </div>     
    </div>
  )
}

