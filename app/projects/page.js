'use client'
import Sidebar from 'components/Sidebar.js'
import Editor from 'components/TabEditor.js'
import ConfirmDelete from 'components/ConfirmDelete.js'
import EditObjectWindow from 'components/EditObjectWindow.js'
import { TabsContext } from 'components/Context.js'
import OpenObjectsWindow from 'components/OpenObjectsWindow'
import { MenuBar } from 'quantifyjs'
import menuBarStyles from 'styles/MenuBar.module.css'

import styles from './page.module.css'

import { useSession } from "next-auth/react"
import { useState, useEffect, useContext } from 'react'
import { formatRawTabs } from 'lib/tabhelper.js'

// import { ObjectId } from 'mongodb'


export default function Projects({ }) {
  const session = useSession()

  let [tabs, setTabs] = useState([])
  let [projectTabs, setProjectTabs] = useState([])

  let {
    userTabs, setUserTabs, loadUserTabs,
    googleTabs, setGoogleTabs, loadGoogleTabs,
    projects, setProjects,
    openProjectId, setOpenProjectId,
    sortTabs,
    formatFolderContents,
  } = useContext(TabsContext)

  let [sidebarItemId, setSidebarItemId] = useState(null)
  let [user, setUser] = useState(null)
  
  let [editTab, setEditTab] = useState(null)
  let [deleteTabId, setDeleteTabId] = useState(null)
  let [deleteProjectId, setDeleteProjectId] = useState(null)
  let [isNewTab, setIsNewTab] = useState(false)

  let [sidebarSortBy, setSidebarSortBy] = useState('createdTime descending')
  let [createNewSidebarItem, setCreateNewSidebarItem] = useState(false)
  let [showSidebarSearchBar, setShowSidebarSearchBar] = useState(false)


  let [editObject, setEditObject] = useState(undefined)
  let [openObjects, setOpenObjects] = useState(undefined)
  let [tabTextObj, setTabTextObj] = useState({})

  let [showSidebar, setShowSidebar] = useState(true)
  let [action, setAction] = useState(undefined)

	function closeMenus() {
		setAction(undefined)
		setOpenObjects(undefined)
		setEditObject(undefined)
		// setToDeleteId(undefined)
		// setSelectedId(undefined)
	}

  // Fetch user data on startup
  useEffect( () => {
    async function getProjects() {
      if (projects.length == 0 ) {
        let userProjects = await fetch(`/api/projects?userid=${session.data.user_id}`).then(r => r.json())
        console.log('userProjects:', userProjects)
        setProjects(userProjects)
      }    
    }

    getProjects()
  }, [] )

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
    async function getProjectTabs() {
      let project = projects.find(p => p._id === openProjectId)
      // console.log('getProjectTabs', project, tabs)
      if (project && project.folder) {
        let folderResponse = await fetch(`/api/folder?id=${project.folder}`).then(r => r.json())
        console.log('folderResponse:', folderResponse)
        setProjectTabs(folderResponse)
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
            let artistName = t['name'].split(' - ')[0].trim()
            let songName = t['name'].split(' - ')[1].trim()
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


  // Projects
  function addProjectMenu() {
    console.log('new project session', session)
    setAction('new project')
    fetch(`/api/project?userid=${session.data.user_id}`, { method: 'GET' })
      .then(r => r.json())
      .then(newProject => {
        // console.log('new project', newProject)
        setEditObject(newProject)
        // setProjects([...projects, newProject])
      }) 
  }

  async function onAddProject() {
    // Create new folder in projects folder
    let newProject = editObject

    let profile = await fetch(`/api/profile?id=${session.data.user_id}`)
      .then(r => r.json())
      // .then(profile => {
    // console.log('add project profile', profile, newProject)
    if (!('projectsFolder' in profile) ) {
      console.log('no projects folder')
      return;
    } 

    let newFolder = await fetch(`/api/folder`, { 
      method: 'POST',
      body: JSON.stringify({
        name: newProject.name,
        parent_folder: profile.projectsFolder,
      })
    }).then(r => r.json())
      // .then(newFolder => {

      // })

    newProject.folder = newFolder.data.id
    console.log('newFolder', newFolder, newProject)

    fetch(`/api/project?id=${newProject._id}`, { 
      method: 'PUT',
      body: JSON.stringify(newProject)
    })
      // })

    // Add new project to projects state
    setProjects([
      ...projects,
      newProject,
    ])
    
    onOpenProject(newProject._id)
    setAction(undefined)
  }

  function editProjectMenu() {
    setAction('edit project')
    setEditObject(projects.find(p => p._id === openProjectId))
  }

  async function onSaveProject(project) {
    console.log('save project', project)
    // let newFolder
    let saveProject = project
    let projectId = project.id
    let profile = await fetch(`/api/profile?id=${session.data.user_id}`)
      .then(r => r.json())
    
    if (profile.projectsFolder) {
      let newFolder
      if (!saveProject.folder || saveProject.folder == '') {
        // newFolder = await fetch(`/api/folder`, {
        //   method: 'PUT',
        //   body: JSON.stringify({
        //     // user: profile,
        //     name: saveProject.name,
        //     folder: saveProject.folder,
        //   })
        // }).then(r => r.json())
        // console.log('newFolder:', newFolder)
        // saveProject.folder = newFolder.id
        console.log('problem')
      }
      else {
        newFolder = await fetch(`/api/folder`, {
          method: 'POST',
          body: JSON.stringify({
            // user: profile,
            name: saveProject.name,
            folder: saveProject.folder,
          })
        }).then(r => r.json())
        console.log('updated folder:', newFolder)
        // saveProject.folder = newFolder.id
      }
    }

    // let GOOGLE_ID_LENGTH = 33
    // if (!saveProject.folder || saveProject.folder == '' || saveProject.folder.length != GOOGLE_ID_LENGTH) {
    //   setErrorMessage('Folder is required.');
    //   return
    // }


    fetch(`/api/project`, {
      method: 'POST',
      body: JSON.stringify(project)
    })


    // // console.log({
    // //   projects,
    // //   projectId,
    // //   p: projects.map(p => p.id).includes(projectId),
    // // })

    // if (projects.map(p => p.id).includes(projectId)) {
    //   console.log('replacing', saveProject)
      setProjects(projects.map(p => p.id == projectId ? project : p))
    // }
    // else {
    //   console.log('appending', saveProject)
    //   setProjects([...projects, saveProject])
    // }

    // console.log('saved ', saveProject)
    // close(event)
    closeMenus()
  }

  function openProjectMenu() {
    setAction('open project')
    setOpenObjects(projects)
  }

  function onOpenProject(project) {
    console.log('onOpenProject', project)
    setOpenProjectId(project._id)
    setOpenObjects(undefined)
  }

  function openProjectFolder(projectId) {
    const project = projects.find(p => p._id === projectId)
    console.log('openProjectFolder', projectId, project)
    if (project.folder) {
      window.open(`https://drive.google.com/drive/u/0/folders/${project?.folder}`)
    }
  }

  function deleteProjectMenu() {
    setAction('delete project')
    setOpenObjects(projects)
  }

  function onDeleteProject(projectId) {
    setDeleteProjectId(projectId)
    setAction('confirm delete project')
  }

  function onConfirmDeleteProject() {
    let project = projects.find(p => p._id === deleteProjectId)
    fetch(`/api/project`, { method: 'DELETE', body: JSON.stringify({ _id: deleteProjectId }) })//.then(r => r.json()
    fetch(`/api/folder`, { method: 'DELETE', body: JSON.stringify({ _id: project.folder})})//.then(r => r.json()
    setProjects(
      projects.filter(p => p._id !== deleteProjectId)
    )
    setOpenProjectId(undefined)
  }
  
  // Tabs
  function addTabMenu() {
    setAction('add tab')
    setOpenObjects(
      tabs
        .filter(t => !(projectTabs.map(pt => pt.name).includes(`${t['artistName']} - ${t['songName']}`)))
        .sort((a, b) => a['artistName'] > b['artistName'] ? 1 : -1)
      )
  }

  function onAddTab(saveTab) {
    const tabId = saveTab._id
    let tab = tabs.find(t => t._id === tabId)
    let project = projects.find(p => p._id === openProjectId)
    console.log('onAddTab', tabId, tab, project)
    fetch('/api/shortcut', {
        method: 'POST', 
        body: JSON.stringify({
          tab: {
            artistName: tab.artistName,
            songName: tab.songName,
            googleDocsId: tab.googleDocsId,
          },
          folder: project.folder,
          // account: account

        })
      })
      .then(r => r.json())
      .then(responseData => {
        // const responseData = r.data
        console.log('add tab', responseData)
        setProjectTabs([
          responseData,
          ...projectTabs,
        ])
      })

    setAction(undefined)
    setOpenObjects(undefined)
  }

  function deleteTabMenu() {
    setAction('delete tab')
    setOpenObjects(projectTabs)
  }

  function onDeleteTab(tab) {
    const tabId = tab._id
    const deleteTab = projectTabs.find(pt => pt._id === tabId)
    fetch(`/api/shortcut`, { method: 'DELETE', body: JSON.stringify({ id: deleteTab.id }) }).then(r => r.json())
    setProjectTabs(projectTabs.filter(pt => pt._id !== tabId))

    setAction(undefined)
    setOpenObjects(undefined)
  }

  async function createSpotifyPlaylist() {
    console.log('create spotify playlist', projectTabs)
    let project = projects.find(p => p._id == openProjectId)

    let spotifyPlaylist = await fetch(`/api/playlist`, {
      method: 'POST',
      body: JSON.stringify({
        userId: session.data.user_id,
        name: `[tabr] ${project.name}`,
        description: '',
        playlistId: project?.spotifyPlaylistId,
        tabs: tabs.filter(t => projectTabs.map(pt => pt.shortcutDetails.targetId).includes( t.googleDocsId ) )
      })
    }).then(r => r.json())

    console.log('create spotify playlist:', spotifyPlaylist)

    let newProject = {
      ...project,
      spotifyPlaylistId: spotifyPlaylist.id
    }

    console.log('newProject', newProject)

    fetch(`api/project`, { method: 'POST', body: JSON.stringify(newProject)})
    setProjects(
      projects.map(p => p._id == openProjectId ? newProject : p)
    )
  }

  function openSpotifyPlaylist() {
    window.open(`https://open.spotify.com/playlist/${projects.find(p => p._id == openProjectId).spotifyPlaylistId}` )
  }

  
 return (
    <div className={styles.container}>
      <ConfirmDelete // Confirm Delete Tab
        item={tabs.find(t => t._id === deleteTabId)}
        action={onDeleteTab}
        label={'delete'}
        show={action === 'confirm delete tab'} 
        close={closeMenus}
      />      
      <OpenObjectsWindow // Open Project
        openObjects={openObjects}
        setOpenObjects={setOpenObjects}
        onOpenObject={onOpenProject}
        show={action === 'open project'}
        keyFunction={d => d._id}
        labelFunction={d => `${d['name']}`}
        close={closeMenus}
      />
      <EditObjectWindow // Add Project
        editObject={editObject}
        setEditObject={setEditObject}
        onOpenObject={onAddProject}
        show={action === 'new project'}
        subset={['name']}
        close={closeMenus}
      />
      <EditObjectWindow // Edit Project
        editObject={editObject}
        setEditObject={setEditObject}
        save={onSaveProject}
        show={action === 'edit project'}
        subset={['name']}
        close={closeMenus}
      />
      <OpenObjectsWindow // Delete Project
        openObjects={openObjects}
        setOpenObjects={setOpenObjects}
        onOpenObject={onDeleteProject}
        show={action === 'delete project'}
        keyFunction={d => d._id}
        close={closeMenus}
      />
      <ConfirmDelete // Confirm Delete Project
        item={projects.find(t => t._id === deleteProjectId)}
        action={onConfirmDeleteProject}
        label={'delete'}
        show={action === 'confirm delete project'} 
        keyFunction={d => d._id}
        close={closeMenus}
      />


      <OpenObjectsWindow // Add Tab
        openObjects={openObjects}
        setOpenObjects={setOpenObjects}
        onOpenObject={onAddTab}
        show={action === 'add tab'}
        keyFunction={d => d._id}
        labelFunction={d => `${d['artistName']} - ${d['songName']}` }
        close={closeMenus}
      />
      <OpenObjectsWindow // Delete Tab
        openObjects={openObjects}
        setOpenObjects={setOpenObjects}
        onOpenObject={onDeleteTab}
        show={action === 'delete tab'}
        keyFunction={d => d._id}
        close={closeMenus}
      />

      <div className={styles['content']}>
        <div className={styles['menu-bar-container']}>
          <MenuBar 
            setEditObject={setEditObject}
            className={styles['menu-bar']} 
            styles={menuBarStyles}
            items={{
              file: [{
                  title: 'new project',
                  onClick: () => addProjectMenu(),
                  disabled: false,
                },{
                  title: 'open project',
                  onClick: () => openProjectMenu(),
                  disabled: false,
                },{
                  title: 'edit project',
                  onClick: () => editProjectMenu(),
                  disabled: !!!openProjectId,
                // },{
                //   title: 'share project',
                //   onClick: () => {},
                //   disabled: true,
                // },{
                  // title: 'save project',
                  // onClick: () => saveProject(project),
                  // disabled: true,
                // },{
                //   title: 'unfollow project',
                //   onClick: () => {},
                //   disabled: disabled,
                },{
                  title: 'delete project',
                  onClick: () => deleteProjectMenu(),
                  disabled: false,
              }],
              project: [{
                  title: 'add tab',
                  onClick: () => addTabMenu(),
                  disabled: (!!!openProjectId)
                },{
                  title: 'delete tab',
                  onClick: () => deleteTabMenu(),
                  disabled: (!!!openProjectId),
                },{
                  title: 'open project folder in Drive',
                  onClick: () => openProjectFolder(openProjectId),
                  disabled: (!!!openProjectId),
                },{
                  title: 'update Spotify playlist',
                  onClick: () => createSpotifyPlaylist(),
                  disabled: (!!!openProjectId),
                },{
                  title: 'open Spotify playlist',
                  onClick: () => openSpotifyPlaylist(),
                  disabled: (!!!openProjectId),
                },{
                  title: 'pin tab',
                  onClick: () => {},
                  disabled: (!!!openProjectId),
              }],
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
            sidebarItems={projectTabs}
            // setSidebarItems={setTabs}
            sidebarItemId={sidebarItemId}
            setSidebarItemId={setSidebarItemId}
            searchFunction={d => d.id}
            keyFunction={d => d.id}
            SidebarItemComponent={(datum) => {
              if (!datum) return;

              let artistName = datum['name'].split(' - ')[0].trim()
              let songName = datum['name'].split(' - ')[1].trim()
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
            keyFunction={d=>d.googleDocsId}
            mode='view'
            tabs={tabs}
            setTabs={setTabs}
            tabId={projectTabs.find(pt => pt.id === sidebarItemId)?.shortcutDetails.targetId}
          />
        </div> 
      </div>     
    </div>
  )
}

