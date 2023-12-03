import { useState, useEffect, useContext } from 'react'
// import { MenuBar, Dropdown } from 'quantifyjs'

import FullscreenWindow from '../components/FullscreenWindow.js'

export default function PickProjectWindow({ 
  projects, 
  openProjectId,
  setOpenProjectId, 
  setPickProject,
  show 
}) {
console.log('pick project', {
  projects
})
// const project = projects.find(p => p.id == projectId)
const [selectedProjectId, setSelectedProjectId] = useState(openProjectId ?? projects[0]?.id)

function open() {
  console.log('open', selectedProjectId)
  setOpenProjectId(selectedProjectId)
  setPickProject(false)
}

function close() {
  console.log('close')
  setPickProject(false)
}

function onClick(event) {
  //double click
  if (event.detail == 2) { 
    open()
  }
}

return <FullscreenWindow
  show={show}
  action={open}
  actionLabel='open'
  close={close}
  content={<select size='5' onChange={e => { e.preventDefault(); console.log(e.target.value); setSelectedProjectId(e.target.value)}}>
    {projects.map(project => {
      return (
        <option 
          key={project.id} 
          selected={project.id==selectedProjectId} 
          id={project.id} 
          value={project.id}
          onClick={onClick}>
          {project.name}
        </option>)
    })}
  </select>}
/>
}