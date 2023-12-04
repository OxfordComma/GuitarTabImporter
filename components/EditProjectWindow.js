import { useState, useEffect, useContext } from 'react'
import { MenuBar, Dropdown } from 'quantifyjs'

import FullscreenWindow from '../components/FullscreenWindow.js'

export default function EditProjectWindow({ 
  show=false,
  projects, 
  setProjects, 
  projectId, 
  editProject,
  setEditProject, 
  styles,
  user,
}) {
  const [project, setProject] = useState(projects.find(p => p.id == projectId))
  const [errorMessage, setErrorMessage] = useState('')
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

    let newFolder
    let saveProject = project


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

  function close(event) {
    event.preventDefault()
    setEditProject(null)
    setErrorMessage('')

    if (!project.folder) {
      // console.log('replacing', project)
      setProjects(projects.filter(p => p.id != projectId))
    }
    // else {
    //   console.log('appending', project)
    //   setProjects([...projects, project])
    // }



  }

  return (<FullscreenWindow
    show={show}
    action={save}
    close={close}
    actionLabel='save'
    content={
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{color: 'yellow'}}>{errorMessage}</div>
        {
          project != null ? Object.entries(project).map(entry => {
            let key = entry[0]
            let value = entry[1]

            if (!['name', 'folder'].includes(key)) {
              return
            }

            let onChangeFunctions = {
              name: setProjectName,
              folder: setProjectFolder,
            }

            return <InfoRow 
              key={key} 
              label={key} 
              value={value} 
              errorMessage={errorMessage}
              // onChange={onChangeFunctions[key]}
              // items={key=='tuning' ? ['EADGBe', 'DADGBe', 'D#G#C#F#A#D#'] : undefined}
            />

          }) : null
        }
      </div>
    }
    />
  )
}

function InfoRow({
  key, value, label, errorMessage, disabled=false, onChange=() => {}
}) {
  return (<div style={{display: 'flex'}}>
    <label style={{flex: 1}} htmlFor={label}>{label}</label>
    <input style={{flex: 1}} type="text" name={label} value={value} disabled={disabled} onChange={onChange}/>
  </div>)
}