'use client'
import Header from 'components/Header.js'
import Sidebar from 'components/Sidebar.js'
import Editor from 'components/TabEditor.js'
import FullscreenWindow from 'components/FullscreenWindow.js'
import EditProjectWindow from 'components/EditProjectWindow.js'
import PickProjectWindow from 'components/PickProjectWindow.js'
import PickTabWindow from 'components/PickTabWindow.js'
import ConfirmDelete from 'components/ConfirmDelete.js'
import {TabsContext} from 'components/Context.js'

import { MenuBar } from 'quantifyjs'
import menuBarStyles from 'styles/MenuBar.module.css'

import styles from './page.module.css'

import { useSession, signIn } from "next-auth/react"
import { useState, useEffect, useContext } from 'react'
// import cheerio from 'cheerio'


function formatTabName(tab) {
  return `${tab.artistName} - ${tab.songName}`
}

function formatProjectName(project) {
  return `${project.name}`
}

export default function Projects() {
  const { data: session, status } = useSession()

  let [user, setUser] = useState(null)
  let [folder, setFolder] = useState('')
  let [url, setUrl] = useState('') 

  let [showSidebar, setShowSidebar] = useState(true)


  let {
    // userTabs: tabs,
    googleTabs: userGoogleTabs, setGoogleTabs: setUserGoogleTabs,
    projects, setProjects,
    openProjectId, setOpenProjectId,
    sortTabs,
    formatFolderContents,
  } = useContext(TabsContext)

  let [projectTabs, setProjectTabs] = useState([])
  let [pinnedTabs, setPinnedTabs] = useState([])

  let [sidebarItemId, setSidebarItemId] = useState(null)
  let [sidebarSortBy, setSidebarSortBy] = useState('artist ascending')

  let [pickProject, setPickProject] = useState(false)
  let [pickTab, setPickTab] = useState(false)
  let [editProject, setEditProject] = useState(null)
  let [deleteProject, setDeleteProject] = useState(null)
  

  useEffect( () => {
    const getData = async () => {
      console.log('get data', {
        projects
      })
      let user = await fetch('/api/user').then(r => r.json())
      console.log('user:', user)
      setUser(user)

      if (projects.length == 0 ) {
        let userProjects = await fetch('/api/projects?userid=' + user._id).then(r => r.json())
        console.log('userProjects:', userProjects)
        setProjects(userProjects)
      }

      if (userGoogleTabs.length == 0 ) {
        console.log('current userGoogleTabs:', userGoogleTabs)
        let folderContents = await fetch('/api/folder?folder=' + user.folder).then(r => r.json())
        // folderContents = folderContents.map(fc => formatFolderContents(fc, user))
        console.log('usergoogleTabs:', folderContents)
        setUserGoogleTabs(folderContents)
      }

      if (user.lastOpenedProject) {
        setOpenProjectId(user.lastOpenedProject)
      }
    }

    getData()
  }, [] )

  useEffect(() => {
    console.log('projects', projects)
  }, [projects])

  useEffect(() => {
    const getData = async () => {

      // let userTabs = await fetch('/api/tabs?userid=' + user._id).then(r => r.json())
      let project = projects.find(p => p.id == openProjectId)
      console.log('found project:', project)

      if (!project || !project?.folder) 
        return;


      let projectTabs = await fetch('/api/folder?folder=' + project.folder).then(r => r.json())
      projectTabs = projectTabs.map(fc => formatFolderContents(fc, user))

      console.log('projectTabs:', projectTabs)

      let allTabs = sortTabs(projectTabs, sidebarSortBy)

      allTabs = allTabs.map((at, i) => {
        at['index'] = i
        return at
      })


      console.log('allTabs:', allTabs)
      setProjectTabs(allTabs)
      console.log('pinnedTabs:', project.pinnedTabs)
      setPinnedTabs(project.pinnedTabs ?? [])

    }
    getData()
  }, [editProject, openProjectId])

  useEffect(() => {
    setSidebarItemId(null)
    if (user?.lastOpenedProject && (user?.lastOpenedProject !== openProjectId) ) {
      setUser({
        ...user,
        lastOpenedProject: openProjectId,
      })
      console.log('last opened project', openProjectId, user)
      fetch('/api/user', {
        method: 'POST',
        body: JSON.stringify({
          email: session.user.email,
          // folder: session.user.folder,
          // projectsFolder: session.user.projectsFolder,
          // instruments: session.user.instruments,
          lastOpenedProject: openProjectId,
        })

      })
      // let projectTabs = await fetch('/api/folder?folder=' + project.folder).then(r => r.json())
    }
  }, [openProjectId])

  useEffect(() => {
    let project = projects.find(p => p.id == openProjectId)

    let newProject = {
      ...project,
      pinnedTabs: pinnedTabs,
    }
    setProjects(
      projects.map(p => p.id == openProjectId ? newProject : p)
    )
  }, [pinnedTabs])


  function newProjectMenu() {
    let newProject = {
      id: Math.random().toString(16).slice(2),
      name: 'name',
      owner: user._id,
      creator: user._id,
      collaborators: [],
      folder: '',
    }
    setOpenProjectId(newProject.id)
    setEditProject(true)
    setProjects([...projects, newProject])
  }

  function openProjectMenu() {
    setPickProject(true)
  }

  function editProjectMenu() {
    setOpenProjectId(openProjectId)
    setEditProject(true)
  }

  function confirmDeleteProjectMenu() {
    // setDeleteProjectId(openProjectId)
    setDeleteProject(true)
  }

  function addTabMenu() {
    setPickTab(true)
  }

  function pinTab(googleDocsId) {
    console.log('projects', projects)
    let project = projects.find(p => p.id == openProjectId)
    console.log('pin tab for project', project)
    let pinnedTabs = project?.pinnedTabs ?? []
    let newPinnedTabs = pinnedTabs
    if (pinnedTabs.includes(googleDocsId)) {
      newPinnedTabs = pinnedTabs.filter(d => d != googleDocsId)
    }
    else {
      newPinnedTabs = [
        ...pinnedTabs, googleDocsId
      ]
    }

    setPinnedTabs(newPinnedTabs)

    // fetch(`/api/project`, {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     id: openProjectId,
    //     pinnedTabs: newPinnedTabs,
    //   })
    // })
  }

  function signInWithSpotify() {
    signIn('spotify', { callbackUrl: `/projects` })
  }

  async function createSpotifyPlaylist() {
    // window.open();  
    let spotifyPlaylist = await fetch(`/api/createplaylist`, {
      method: 'POST',
      body: JSON.stringify({
        userId: user._id,
        projectId: openProjectId,
        tabs: projectTabs,
      })
    }).then(r => r.json())

    console.log('spotifyPlaylist:', spotifyPlaylist)

    let project = projects.find(p => p.id == openProjectId)
    let newProject = {
      ...project,
      spotifyPlaylistId: spotifyPlaylist.id
    }
    setProjects(
      projects.map(p => p.id == openProjectId ? newProject : p)
    )
  }

  async function onClickSidebarItem(id) {
    console.log('d', id, projectTabs)
    let tab = projectTabs.find(t => t.id == id)
    if (tab.googleDocsId){
      let tabText = await fetch('api/document?documentid='+tab.googleDocsId)
        .then(r => r.json())

      console.log('loaded tab', tabText)

      tab.tabText = tabText

      // const $ = cheerio.load(tabHtml);

      // let tabTextList = []

      // $('tr > td > p').each((i, elem) => {
        // console.log( $(elem).html() )
        // tabTextList.push( $(elem).text() )
        // tabTextList.push( $(elem, '* > not(sup)').text() )
      // })
      // console.log('cheerio text:', tabTextList)
      // console.log('cheerio text:', tabTextList.join('\n'))
    
      tab.tabText = tab.tabText
        // .replace(tuningRegex, '')
        .replace(formatTabName(tab), '')
        .replace(/-{76,77}/g, '')
        .replace(/^ +$/m, '')
        .replace(/^(\r\n|\r|\n)/mg, '')

      var tuningRegex = new RegExp("((?:[DE]ADGBe)|D#G#C#F#A#[Dd#])", "g")
      if (tab.tabText.match(tuningRegex)) {
        tab.tuning = tab.tabText.match(tuningRegex)[0];

        tab.tabText = tab.tabText.replace(`${tab.tuning}`, '')
        tab.tabText = tab.tabText
      }

      var capoRegex = new RegExp("([Cc]apo (\\d))", "g")
      if (tab.tabText.match(capoRegex)) {
        tab.capo = ( tab.tabText.match(capoRegex)[1] );
        console.log('tab:', tab)

        // tab.tabText = tab.tabText.replace(tab.tabText.match(capoRegex)[0], '')
        tab.tabText = tab.tabText.replace(capoRegex, '')
      }
      
      tab.tabText = tab.tabText.slice(2)

      console.log('google doc:', tab)
      console.log('google doc text:', tab.tabText)
    }

    setProjectTabs(
      projectTabs.map(t => t.id == tab.id ? tab : t)
    )
  }


  async function addTabToProject(tabId) {
    let googleTab = userGoogleTabs.find(t => t.id == tabId)
    console.log('raw google tab', googleTab)
    googleTab = formatFolderContents(googleTab, user)
    let project = projects.find(p => p.id == openProjectId)
    let userId = user._id
    let account = await fetch(`/api/account?userid=${userId}`, {
      headers: new Headers(headers()),
    }).then(r => r.json())

    console.log({googleTab, project})
    let createTab = await fetch('/api/create?shortcut', {
        method: 'POST', 
        body: JSON.stringify({
          tab: {
            artistName: googleTab.artistName,
            songName: googleTab.songName,
            googleDocsId: googleTab.googleDocsId,
          },
          folder: project.folder,
          account: account

        })
      }).then(r => r.json())
      console.log({createTab: createTab})

      setProjectTabs([
        ...projectTabs, formatFolderContents({
          ...createTab.data, id: googleTab.googleDocsId,
        }, user)
      ])
    }

  async function saveProject(project) {

    let newFolder
    let saveProject = project
    console.log('save project', project)
    let projectId = project.id


    if (user.projectsFolder && (!saveProject.folder || saveProject.folder == '')) {
      newFolder = await fetch(`/api/folder`, {
        method: 'POST',
        body: JSON.stringify({
          user: user,
          name: saveProject.name,
          folder: user.projectsFolder,
        })
      }).then(r => r.json())
      console.log('newFolder:', newFolder)
      saveProject.folder = newFolder.id
    }

    let GOOGLE_ID_LENGTH = 33
    if (!saveProject.folder || saveProject.folder == '' || saveProject.folder.length != GOOGLE_ID_LENGTH) {
      setErrorMessage('Folder is required.');
      return
    }


    await fetch(`/api/project`, {
      method: 'POST',
      body: JSON.stringify(saveProject)
    })


    // console.log({
    //   projects,
    //   projectId,
    //   p: projects.map(p => p.id).includes(projectId),
    // })

    if (projects.map(p => p.id).includes(projectId)) {
      console.log('replacing', saveProject)
      setProjects(projects.map(p => p.id == projectId ? saveProject : p))
    }
    else {
      console.log('appending', saveProject)
      setProjects([...projects, saveProject])
    }

    console.log('saved ', saveProject)
    close(event)
  }

    

  async function requestDeleteProject(projectId) {
    // let project = projects.find(p => p.id == projectId)
    let userId = user._id
    let account = await fetch(`/api/account?userid=${userId}`, {
      headers: new Headers(headers()),
    }).then(r => r.json())
    console.log('deleting project', projects, projectId)

    let deleteProjectRequest = await fetch('/api/project', {
        method: 'DELETE', 
        body: JSON.stringify({
          // tab: {
          //   artistName: googleTab.artistName,
          //   songName: googleTab.songName,
          //   googleDocsId: googleTab.googleDocsId,
          // },
          // folder: project.folder,
          // account: account
          account: account,
          id: projectId,

        })
      }).then(r => r.json())
      console.log({deleteProject: deleteProjectRequest})

      setProjects(
        projects.filter(p => p.id != projectId)
      )
      setProjectTabs([])
      setOpenProjectId(null)

    }
  // }

    function sidebarItem( datum ) {
      let loaded = datum.tabText != ''
      // let pinned = datum.pinnedTabs && datum.pinnedTabs.length > 0
      return ([
        <div key='name' style={{ opacity: loaded ? 1 : 0.6, width: '100%' }}>{datum.songName}</div>,
        // <div key='pinned' style={{ opacity: pinned ? 1 : 0 , width: '25px'}}>{'📌'}</div>,
        // <div key='loaded' style={{opacity: loaded? 1 : 0.6, marginLeft: 'auto'}}>{loaded? '✓' : null}</div>,
        // <div key='docsId' style={{width: '10px'}}>{datum.googleDocsId ? 'G' : null}</div>,
    ])
  }

 
  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        {showSidebar ? <Sidebar
          sidebarItems={projectTabs}
          setSidebarItems={setProjectTabs}
          sidebarItemId={sidebarItemId}
          setSidebarItemId={setSidebarItemId}
          setDeleteProject={setDeleteProject}
          sidebarSortBy={sidebarSortBy}
          setSidebarSortBy={setSidebarSortBy}
          SidebarItemComponent={sidebarItem}
          itemIsEnabled={d => d.tabText != ''}
          onClickSidebarItem={onClickSidebarItem}
          pinnedItems={pinnedTabs}
          setPinnedItems={setPinnedTabs}
          pinnedItemFunction={d => d['googleDocsId']}
          search={true}
          searchFunction={formatTabName}
          menuBar = {
            <SidebarMenuBar
              sidebarSortBy={sidebarSortBy}
              setSidebarSortBy={setSidebarSortBy}
              projects={projects}
              openProjectId={openProjectId}
              sidebarItems={projectTabs}
              sidebarItemId={sidebarItemId}
              newProjectMenu={newProjectMenu}
              openProjectMenu={openProjectMenu}
              editProjectMenu={editProjectMenu}
              confirmDeleteProjectMenu={confirmDeleteProjectMenu}
              addTabMenu={addTabMenu}
              setEditProject={setEditProject}
              createSpotifyPlaylist={createSpotifyPlaylist}
              signInWithSpotify={signInWithSpotify}
              pinTab={pinTab}
              saveProject={saveProject}
            />
          }
        /> : <div></div>}
      </div>
      <div className={styles.editor}>
        <Editor
          tabs={projectTabs}
          tabId={sidebarItemId}
          // setTabs={setProjects}
          userId={user?._id}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          mode='view'
        />
      </div>    
      <div>

      <EditProjectWindow
        show={editProject != null}
        projects={projects}
        projectId={openProjectId}
        setProjects={setProjects}
        saveProject={saveProject}
        editProject={editProject}
        setEditProject={setEditProject}
        styles={styles}
        user={user}
      />
      <PickProjectWindow
        projects={projects}
        // projectId={editProject}
        openProjectId={openProjectId}
        setOpenProjectId={setOpenProjectId}
        setPickProject={setPickProject}
        show={pickProject}
      />
      <PickTabWindow
        projectTabs={projectTabs}
        googleTabs={userGoogleTabs}
        addTabToProject={addTabToProject}
        formatTabName={formatTabName}
        formatFolderContents={formatFolderContents}
        // projectId={editProject}
        // openProject={openProject}
        // setOpenProjectId={setOpenProjectId}
        setPickTabs={setPickTab}
        show={pickTab}
        user={user}
      />
      <ConfirmDelete 
        show={deleteProject === true}  
        deleteFrom={projects}
        deletedItemId={openProjectId}
        setDeleteFrom={setProjects}
        close={()=>setDeleteProject(null)}
        deleteItem={(e) => { 
          e.preventDefault();
          // console.log('delete item:', e.target.value) 
          requestDeleteProject(openProjectId); 
          setDeleteProject(null) 
        }}
      />
      </div>  
    </div>
  )
}



function SidebarMenuBar({ 
  newProjectMenu,
  openProjectMenu,
  editProjectMenu, 
  addTabMenu,
  confirmDeleteProjectMenu,
  setEditProject, 
  sidebarItems,
  sidebarItemId,
  projects,
  setProjects,
  sidebarSortBy,
  setSidebarSortBy,
  openProjectId,
  createSpotifyPlaylist,
  signInWithSpotify,
  showSidebar,
  setShowSidebar,
  pinTab,
  saveProject,
}) { 

let disabled = openProjectId==null

let project = projects.find(p => p.id==openProjectId)

return (<div style={{display: 'flex', width: '100%',alignItems: 'center'}}>
  <MenuBar
    items={
      {
        file: [{
            title: 'new project',
            onClick: () => newProjectMenu(),
            disabled: false,
          },{
            title: 'open project',
            onClick: () => openProjectMenu(),
            disabled: false,
          },{
            title: 'edit project',
            onClick: () => editProjectMenu(),
            disabled: disabled,
          },{
            title: 'share project',
            onClick: () => {},
            disabled: disabled,
          },{
            title: 'save project',
            onClick: () => saveProject(project),
            disabled: disabled,
          // },{
          //   title: 'unfollow project',
          //   onClick: () => {},
          //   disabled: disabled,
          },{
            title: 'delete project',
            onClick: () => confirmDeleteProjectMenu(),
            disabled: disabled,
        }],
        project: [{
            title: 'add tab',
            onClick: () => addTabMenu(),
            disabled: disabled
          },{
            title: 'open project folder in Drive',
            onClick: () => window.open(`https://drive.google.com/drive/u/0/folders/${project?.folder}`),
            disabled: disabled || !project?.folder,
          },{
            title: 'create Spotify playlist',
            onClick: () => createSpotifyPlaylist(),
            disabled: disabled,
          },{
            title: 'sign in with Spotify',
            onClick: () => signInWithSpotify(),
            disabled: disabled,
          },{
            title: 'pin tab',
            onClick: (e) => {e.preventDefault(); pinTab(sidebarItems.find(s => s.id == sidebarItemId).googleDocsId)},
            disabled: sidebarItemId === null,
        }],
        sort: [
          {
            title: 'sort by artist',
            onClick: () => sidebarSortBy == 'artist ascending' ? setSidebarSortBy('artist descending') : setSidebarSortBy('artist ascending'),
            disabled: disabled,
          }, {
            title: 'sort by song name',
            onClick: () => sidebarSortBy == 'songName ascending' ? setSidebarSortBy('songName descending') : setSidebarSortBy('songName ascending'),
            disabled: disabled,
            
          }, {
            title: 'sort by created date',
            onClick: () => sidebarSortBy == 'createdTime ascending' ? setSidebarSortBy('createdTime descending') : setSidebarSortBy('createdTime ascending'),
            disabled: disabled,
          }, {
            title: "don't sort",
            onClick: () => setSidebarSortBy('index'),
            disabled: disabled,
          }
        ],
      }
    }
    styles={menuBarStyles}
  />
  <div style={{marginLeft: 'auto'}}>
    {openProjectId ? projects.filter(p => p.id==openProjectId).map(project => {
      return (
        formatProjectName(project)
      )
    }) : 'No Open Project'}
  </div>
</div>)
}









