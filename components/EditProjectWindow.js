import { useState, useEffect, useContext } from 'react'
import { MenuBar, Dropdown } from 'quantifyjs'

import FullscreenWindow from '../components/FullscreenWindow.js'

export default function EditProjectWindow({ 
  show=false,
  projects, 
  setProjects, 
  projectId, 
  saveProject,
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
    
    saveProject(project)

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
              onChange={onChangeFunctions[key]}
              // items={key=='tuning' ? ['EADGBe', 'DADGBe', 'D#G#C#F#A#d#'] : undefined}
            />

          }) : null
        }
      </div>
    }types
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