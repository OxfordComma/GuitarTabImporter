import { useState, useEffect, useContext } from 'react'
import { MenuBar, Dropdown } from 'quantifyjs'

import FullscreenWindow from '../components/FullscreenWindow.js'

export default function EditProjectWindow({ 
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
              <input 
                style={{flex: 1}} 
                type="text" 
                name={key} 
                value={value} 
                disabled={!['name', 'folder'].includes(key)}
                onChange={e => {e.preventDefault(); setProject({
                  ...project, [key]: e.target.value 
                });}}
              />
            </div>)
          }) : null
        }
      </div>
    }
    />
  )
}