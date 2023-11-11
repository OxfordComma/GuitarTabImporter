import Header from '../components/Header.js'
import Sidebar from '../components/Sidebar.js'
import Editor from '../components/TabEditor.js'
import { MenuBar } from 'quantifyjs'
import menuBarStyles from '../styles/MenuBar.module.css'

import styles from '../styles/projects.module.css'

import { useSession } from "next-auth/react"
import { useState, useEffect } from 'react'

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
      
      <div>
        <label></label>
        <button onClick={action}>{actionLabel}</button>
       </div>

       <div>
        <label></label>
        <button onClick={close}>close</button>
       </div>
    </div>
  </div> : null)
}

function OpenProjectWindow({ 
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
        return (<option selected={project.id==selectedProjectId} id={project.id} value={project.id}>
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

  function formatTabName(tab) {
    return `${tab.artistName} - ${tab.songName}`
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
    // googleTabs.map(gt => console.log(projectTabs.map(pt => pt.googleDocsId), gt.songName, gt.googleDocsId))
    // setFilteredTabs(
    //   googleTabs.filter(gt => !projectTabs.map(pt => formatTabName(pt)).includes(formatTabName(gt)))
    // )
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
          return (<option selected={tab.googleDocsId==selectedId} id={tab.googleDocsId} value={tab.googleDocsId}>
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
  }, [projects])
  
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

    if (projects.map(p => p.id).includes(projectId)) {
      setProjects(projects.map(p => p.id == projectId ? project : p))
    }
    else {
      setProjects([...projects, project])
    }

    console.log('saved ', project)
    close(event)
  }

  function close(event) {
    event.preventDefault()
    setEditProject(null)
  }

  return (show ? <div className={styles['fullscreen-background']}>
    <div className={styles['fullscreen-window']}>
    <div>
      <label htmlFor="id">id</label>
      <input type="text" name="id" value={project?.id} disabled/>
     </div>

     <div>
      <label htmlFor="name">name</label>
      <input type="text" name="name" value={project?.name} onChange={setProjectName}/>
     </div>

     <div>
      <label htmlFor="folder">folder</label>
      <input type="text" name="folder" value={project?.folder} onChange={setProjectFolder}/>
     </div>

     <div>
      <label htmlFor="creator">creator</label>
      <input type="text" name="creator" value={project?.creator} disabled/>
     </div>

     <div>
      <label htmlFor="owner">owner</label>
      <input type="text" name="owner" value={project?.owner} disabled/>
     </div>

     <div>
      <label></label>
      <button onClick={save}>save</button>
     </div>

     <div>
      <label></label>
      <button onClick={close}>close</button>
     </div>

    </div>
  </div> : null)
}

function SidebarMenuBar({ 
    newProjectMenu,
    openProjectMenu,
    editProjectMenu, 
    addTabMenu,
    setEditProject, 
    projects,
    setProjects,
  }) { 

  return (<div>
    <MenuBar
      items={
        {
          file: [{
            title: 'new project',
            onClick: () => newProjectMenu(),
          },{
            title: 'open project',
            onClick: () => openProjectMenu(),
          },{
            title: 'edit project',
            onClick: () => editProjectMenu(),
          },{
            title: 'share project',
            onClick: () => {},
          },{
            title: 'unfollow project',
            onClick: () => {},
          }],
          project: [{
            title: 'add tab',
            onClick: () => addTabMenu(),
          }],
          sort: [
            {
              title: 'sort by artist',
              onClick: () => sortBy == 'artist ascending' ? setSortBy('artist descending') : setSortBy('artist ascending')
            }, {
              title: 'sort by song name',
              onClick: () => sortBy == 'songName ascending' ? setSortBy('songName descending') : setSortBy('songName ascending')
            }, {
              title: 'sort by created date',
              onClick: () => sortBy == 'createdTime ascending' ? setSortBy('createdTime descending') : setSortBy('createdTime ascending')
            }, {
              title: "don't sort",
              onClick: () => setSortBy('index')
            }
          ],
        }
      }
      styles={menuBarStyles}
    />
    {/*<button className={styles['add-tab-button']}  onClick={() => setCreateNew(true)}>+</button>*/}
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

    return {
      id: Math.random().toString(16).slice(2),
      googleDocsId: fc['id'],
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
  }, [openProject])

  function newProjectMenu() {
    let newProject = {
      id: Math.random().toString(16).slice(2),
      name: 'name',
      owner: user._id,
      creator: user._id,
    }
    setEditProject(newProject.id)
    setProjects([...projects, newProject])
  }

  function openProjectMenu() {
    setPickProject(true)
  }

  function editProjectMenu() {
    // setEditProject(sidebarItemId)
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
    return <div>
      <div>{datum.artistName} - {datum.songName}</div>
    </div>
  }

	return (

		<div className={styles.container}>
			<div className={styles.sidebar}>
				<Sidebar
					sidebarItems={projectTabs}
					setSidebarItems={setProjectTabs}
					sidebarItemId={sidebarItemId}
					setSidebarItemId={setSidebarItemId}
					setDeleteProject={setDeleteProject}
          SidebarItemComponent={sidebarItem}
          menuBar = {
            <SidebarMenuBar
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
					sidebarItemId={sidebarItemId}
					userId={user?._id}
					tabs={projects}
					setTabs={setProjects}
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
        projectId={editProject}
        setProjects={setProjects}
        editProject={editProject}
        setEditProject={setEditProject}
        styles={styles}
      />
      <OpenProjectWindow
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

