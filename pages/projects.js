import Header from '../components/Header.js'
import Sidebar from '../components/Sidebar.js'
import Editor from '../components/TabEditor.js'
import { MenuBar } from 'quantifyjs'
import menuBarStyles from '../styles/MenuBar.module.css'

import styles from '../styles/projects.module.css'

import { useSession } from "next-auth/react"
import { useState, useEffect } from 'react'

function formatTabName(tab) {
  return `${tab.artistName} - ${tab.songName}`
}

function formatProjectName(project) {
  return `${project.name}`
}

function FullscreenWindow({ 
    show, 
    content, 
    action=()=>{}, 
    actionLabel='save',
    close=()=>{} 
  }) {
  return (show ? <div className={styles['fullscreen-background']}>
    <div className={styles['fullscreen-window']}>
      
      {content}
      
      <div style={{display: 'flex', justifyContent: 'right'}}>
        <label for='action'></label>
        <button name='action' onClick={action}>{actionLabel}</button>

        <label for='action'></label>
        <button name='close' onClick={close}>close</button>
       </div>
    </div>
  </div> : null)
}

function PickProjectWindow({ 
  projects, 
  openProject,
  setOpenProject, 
  setPickProject,
  show 
}) {
// const project = projects.find(p => p.id == projectId)
const [selectedProjectId, setSelectedProjectId] = useState(openProject ?? projects[0]?.id)

function open() {
  console.log('open', selectedProjectId)
  setOpenProject(selectedProjectId)
  setPickProject(false)
}

function close() {
  console.log('close')
  setPickProject(false)
}

return <FullscreenWindow
  show={show}
  action={open}
  actionLabel='open'
  close={close}
  content={<select size='5' onChange={e => { e.preventDefault(); console.log(e.target.value); setSelectedProjectId(e.target.value)}}>
    {projects.map(project => {
      return (<option key={project.id} selected={project.id==selectedProjectId} id={project.id} value={project.id}>
        {project.name}
      </option>)
    })}
  </select>}
/>
}

function PickTabWindow({ 
  googleTabs,
  projectTabs, 
  addTabToProject,
  // openProject,
  // setOpenProject, 
  setPickTabs,
  show 
}) {
// const project = projects.find(p => p.id == projectId)
const [selectedId, setSelectedId] = useState(googleTabs[0]?.id)
const [filteredTabs, setFilteredTabs] = useState(
  googleTabs
)
const [searchTerm, setSearchTerm] = useState('')

useEffect(() => {
  setFilteredTabs(
    googleTabs
      .filter(gt => !projectTabs.map(pt => formatTabName(pt)).includes(formatTabName(gt)) 
        && formatTabName(gt).toLowerCase().includes(searchTerm.toLowerCase()))
  )
}, [googleTabs, projectTabs, searchTerm])

// useEffect(() => setFilteredTabs(googleTabs), [googleTabs])
function pick() {
  console.log('pick', selectedId)
  addTabToProject(selectedId)
  // setOpenProject(selectedProjectId)
  // setPickProject(false)
  // setSearchTerm('')
  setSelectedId(null)
  setFilteredTabs(
    filteredTabs.filter(t => t.id != selectedId)
  )
}

function close() {
  console.log('close')
  setPickTabs(false)
}



function onSelect(e) {
  e.preventDefault(); 
  console.log(e.target.value); 
  setSelectedId(e.target.value)
}

function onSearch(e) {
  e.preventDefault()
  const newSearchTerm = e.target.value
  console.log('search term:', newSearchTerm)
  setSearchTerm(newSearchTerm)
}


return <FullscreenWindow
  show={show}
  action={pick}
  actionLabel='pick'
  close={close}
  content={
    <div>
      <input onChange={onSearch} value={searchTerm}></input>
      <select size='5' onChange={onSelect}>
      {filteredTabs.map(tab => {
        // console.log('filtered tab:', tab)
        return (<option key={tab.id} selected={tab.googleDocsId==selectedId} id={tab.googleDocsId} value={tab.googleDocsId}>
          {formatTabName(tab)}
        </option>)
      })}
    </select>
  </div>}
/>
}

function ConfirmDelete ({ show, tabs, setTabs, tabId, setDeleteProject }) {
let tab = tabs.find(t => t.id == tabId)

let deleteProject = async () => {
	let deletedTab = await fetch('/api/tab?tabid='+tabId, {
		method: 'DELETE',
	}).then(r => r.json())

  console.log('deleted:', deletedTab)
	console.log('updating this tab:', tab)
	setDeleteProject(null)
  if (tab.googleDocsId) {
    tab['tabText'] = ''
    tab['_id'] = null

    setTabs(tabs.map(t => t.id == tab.id ? tab : t))
  }
  else {
    setTabs(tabs.filter(t => t.id != tabId))
  }
}

return (show ? <div className={styles['confirm-delete']}>
  <div className={styles['confirm-delete-window']}>
    <div style={{opacity: 1}}>Are you sure you want to delete {tab.tabName}?</div>
    <button onClick={() => setDeleteProject(null)}>no</button>
    <button onClick={() => deleteProject(tabId)}>yes</button>
  </div>
</div> : null)
}

function EditProject({ 
  projects, 
  setProjects, 
  projectId, 
  editProject,
  setEditProject, 
  styles 
}) {
const show = editProject != null
const [project, setProject] = useState(projects.find(p => p.id == projectId))

useEffect(() => {
  setProject(projects.find(p => p.id == projectId))
}, [projects, projectId])

function setProjectName(event) {
  event.preventDefault()
  setProject({
    ...project,
    name: event.target.value
  })
}

function setProjectFolder(event) {
  event.preventDefault()
  setProject({
    ...project,
    folder: event.target.value
  })
}

async function save(event) {
  event.preventDefault()

  await fetch(`/api/project`, {
    method: 'POST',
    body: JSON.stringify(project)
  })

  console.log({
    projects,
    projectId,
    p: projects.map(p => p.id).includes(projectId),
  })

  if (projects.map(p => p.id).includes(projectId)) {
    // console.log('replacing', )
    setProjects(projects.map(p => p.id == projectId ? project : p))
  }
  else {
    console.log('appending')

    setProjects([...projects, project])
  }

  console.log('saved ', project)
  close(event)
}

function close(event) {
  event.preventDefault()
  setEditProject(null)
}

return (<FullscreenWindow
  show={show}
  action={save}
  close={close}
  actionLabel='save'
  content={
    <div>
      {
        project != null ? Object.entries(project).map(entry => {
          let key = entry[0]
          let value = entry[1]

          return (<div key={key} style={{display: 'flex'}}>
            <label style={{flex: 1}} htmlFor={key}>{key}</label>
            <input style={{flex: 1}} type="text" name={key} value={value} disabled/>
          </div>)
        }) : null
      }
    </div>
  }
  />)
}

function SidebarMenuBar({ 
  newProjectMenu,
  openProjectMenu,
  editProjectMenu, 
  addTabMenu,
  setEditProject, 
  projects,
  setProjects,
  sidebarSortBy,
  setSidebarSortBy,
  openProject,
}) { 

let disabled = openProject==null


return (<div style={{display: 'flex', width: '100%',}}>
  <MenuBar
    items={
      {
        file: [{
          title: 'new project',
          onClick: () => newProjectMenu(),
          disabled: disabled,
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
          title: 'unfollow project',
          onClick: () => {},
          disabled: disabled,
        }],
        project: [{
          title: 'add tab',
          onClick: () => addTabMenu(),
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
            onClick: () => sidebarSortBy == 'createdTime ascending' ? setSidebarSortBy('createdTime descending') : setSidebarSortBy('createdTime ascending')
          }, {
            title: "don't sort",
            onClick: () => setSidebarSortBy('index')
          }
        ],
      }
    }
    styles={menuBarStyles}
  />
  <div style={{marginLeft: 'auto'}}>
    {openProject ? projects.filter(p => p.id==openProject).map(project => {
      return (
        formatProjectName(project)
      )
    }) : ''}
  </div>
</div>)
}

export default function Projects(props) {
  const { data: session, status } = useSession()

  let [user, setUser] = useState(null)
  let [folder, setFolder] = useState('')
  let [url, setUrl] = useState('') 

  let [projects, setProjects] = useState([])

  let [projectTabs, setProjectTabs] = useState([])
  let [userGoogleTabs, setUserGoogleTabs] = useState([])
  let [sidebarItemId, setSidebarItemId] = useState(null)
  let [sidebarSortBy, setSidebarSortBy] = useState(null)

  let [openProject, setOpenProject] = useState(null)


  let [pickProject, setPickProject] = useState(false)
  let [pickTab, setPickTab] = useState(false)
  let [editProject, setEditProject] = useState(null)
  let [deleteProject, setDeleteProject] = useState(null)

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
      userId: user._id,
      tabText: '',
      tabName: fc['name'],
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

  useEffect( () => {
    const getData = async () => {
      let user = await fetch('/api/user').then(r => r.json())
      console.log('user:', user)

      let userProjects = await fetch('/api/projects?userid=' + user._id).then(r => r.json())
      console.log('userProjects:', userProjects)

      let folderContents = await fetch('/api/folder?folder=' + user.folder).then(r => r.json())
      folderContents = folderContents.map(fc => formatFolderContents(fc, user))
      console.log('usergoogleTabs:', folderContents)
  	
    	setUser(user)
      setProjects(userProjects)
      setUserGoogleTabs(folderContents)
    }

    getData()
  }, [] )

  useEffect(() => {
    const getData = async () => {
      // let userTabs = await fetch('/api/tabs?userid=' + user._id).then(r => r.json())
      let project = projects.find(p => p.id == openProject)
      console.log('found project:', project)

      if (!project) 
        return;

      let folderContents = await fetch('/api/folder?folder=' + project.folder).then(r => r.json())
      folderContents = folderContents.map(fc => formatFolderContents(fc, user))

      console.log('folderContents:', folderContents)

      let allTabs = [
        // ...userTabs.reverse(), 
        ...folderContents
      ]

      allTabs = allTabs.map((at, i) => {
        at['index'] = i
        return at
      })
      console.log('allTabs:', allTabs)
      setProjectTabs(allTabs)
    }
    getData()
  }, [editProject, openProject])

  function newProjectMenu() {
    let newProject = {
      id: Math.random().toString(16).slice(2),
      name: 'name',
      owner: user._id,
      creator: user._id,
      collaborators: [],
    }
    setOpenProject(newProject.id)
    setEditProject(true)
    setProjects([...projects, newProject])
  }

  function openProjectMenu() {
    setPickProject(true)
  }

  function editProjectMenu() {
    setOpenProject(openProject)
    setEditProject(true)
  }

  function addTabMenu() {
    setPickTab(true)
  }

  async function addTabToProject(tabId) {
    let tab = userGoogleTabs.find(t => t.googleDocsId == tabId)
    let project = projects.find(p => p.id == openProject)
    let userId = user._id
    let account = await fetch(`/api/account?userid=${userId}`).then(r => r.json())

    console.log({tab, project})
    let createTab = await fetch('/api/create?shortcut', {
      method: 'POST', 
      body: JSON.stringify({
        tab: {
          artistName: tab.artistName,
          songName: tab.songName,
          googleDocsId: tab.googleDocsId,
        },
        folder: project.folder,
        account: account

      })
    }).then(r => r.json())

    setProjectTabs([
      ...projectTabs, formatFolderContents(createTab.data, user)
    ])

    // setPickTabs(false)
  }

  function sidebarItem( datum ) {
    let loaded = datum.tabText != ''
    return ([
      <div key='name' style={{opacity: loaded? 1 : 0.6}}>{datum.artistName} - {datum.songName}</div>,
      <div key='loaded' style={{opacity: loaded? 1 : 0.6, marginLeft: 'auto'}}>{loaded? '✓' : null}</div>,
      <div key='docsId' style={{width: '10px'}}>{datum.googleDocsId ? 'G' : null}</div>,
  ])
  }

  useEffect(() => {
    console.log('sidebarSortBy:', sidebarSortBy)
    let newSidebarItems = projectTabs.slice(0).sort((a, b) => {
      if (sidebarSortBy == 'index') {
        return a['index'] > b['index'] ? 1 : -1
      }
      if (sidebarSortBy == 'artist ascending') {
        return a['artistName'].toLowerCase() > b['artistName'].toLowerCase() ? 1 : -1
      }
      if (sidebarSortBy == 'artist descending') {
        return a['artistName'].toLowerCase() < b['artistName'].toLowerCase() ? 1 : -1
      }
      if (sidebarSortBy == 'songName ascending') {
        return a['songName'].toLowerCase() > b['songName'].toLowerCase() ? 1 : -1
      }
      if (sidebarSortBy == 'songName descending') {
        return a['artistName'].toLowerCase() < b['artistName'].toLowerCase() ? 1 : -1
      }
      if (sidebarSortBy == 'createdTime descending') {
        return a['createdTime'] < b['createdTime'] ? 1 : -1
      }
      if (sidebarSortBy == 'createdTime ascending') {
        return a['createdTime'] > b['createdTime'] ? 1 : -1
      }

    })
    console.log('new sidebar items:', newSidebarItems)
    setProjectTabs(newSidebarItems)
  }, [sidebarSortBy])


  return (
  	<div className={styles.container}>
  		<div className={styles.sidebar}>
  			<Sidebar
  				sidebarItems={projectTabs}
  				setSidebarItems={setProjectTabs}
  				sidebarItemId={sidebarItemId}
  				setSidebarItemId={setSidebarItemId}
  				setDeleteProject={setDeleteProject}
          sidebarSortBy={sidebarSortBy}
          setSidebarSortBy={setSidebarSortBy}
          SidebarItemComponent={sidebarItem}
          itemIsEnabled={d => d.tabText != ''}
          onClickSidebarItem={async id => {
            console.log('d', id)
            let tab = projectTabs.find(t => t.id == id)
            if (tab.googleDocsId){
              let tabText = await fetch('api/document?documentid='+tab.googleDocsId)
              .then(r => r.json())
            
              tab.tabText = tabText
                .replace(formatTabName(tab), '')
                .replace(/-{76,77}/g, '')
                .replace(/^ +$/m, '')
                .replace(/^(\r\n|\r|\n)/mg, '')
                .slice(2)

             
              console.log('google doc text:', tab.tabText.slice(0, 5))
            }

            setProjectTabs(
              projectTabs.map(t => t.id == tab.id ? tab : t)
            )
          }}
          menuBar = {
            <SidebarMenuBar
              sidebarSortBy={sidebarSortBy}
              setSidebarSortBy={setSidebarSortBy}
              projects={projects}
              openProject={openProject}
              newProjectMenu={newProjectMenu}
              openProjectMenu={openProjectMenu}
              editProjectMenu={editProjectMenu}
              addTabMenu={addTabMenu}
              setEditProject={setEditProject}
            />
          }
  			/>
  		</div>
  		<div className={styles.editor}>
  			<Editor
  				tabs={projectTabs}
          tabId={sidebarItemId}
  				setTabs={setProjects}
          userId={user?._id}
  			/>
  		</div>		
      <div>

      {/*<ConfirmDelete 
        show={deleteProject != null} 
        tabs={projects} 
        setTabs={setProjects}
        tabId={deleteProject}
        setDeleteProject={setDeleteProject}
      />*/}
      <EditProject
        projects={projects}
        projectId={openProject}
        setProjects={setProjects}
        editProject={editProject}
        setEditProject={setEditProject}
        styles={styles}
      />
      <PickProjectWindow
        projects={projects}
        // projectId={editProject}
        openProject={openProject}
        setOpenProject={setOpenProject}
        setPickProject={setPickProject}
        show={pickProject}
      />
      <PickTabWindow
        projectTabs={projectTabs}
        googleTabs={userGoogleTabs}
        addTabToProject={addTabToProject}
        // projectId={editProject}
        // openProject={openProject}
        // setOpenProject={setOpenProject}
        setPickTabs={setPickTab}
        show={pickTab}
      />
      </div>	
  	</div>
  )
}

