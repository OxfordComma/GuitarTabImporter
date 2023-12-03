import { useState, useEffect, useContext } from 'react'
// import { MenuBar, Dropdown } from 'quantifyjs'

import FullscreenWindow from '../components/FullscreenWindow.js'

export default function PickTabWindow({ 
  googleTabs,
  projectTabs, 
  addTabToProject,
  // openProject,
  // setOpenProject, 
  setPickTabs,
  show,
  formatTabName,
  formatFolderContents,
  user,
}) {
// const project = projects.find(p => p.id == projectId)
const [selectedId, setSelectedId] = useState(googleTabs[0]?.id)
const [filteredTabs, setFilteredTabs] = useState(
  googleTabs.map(t => formatFolderContents(t, user))
)
const [searchTerm, setSearchTerm] = useState('')

useEffect(() => {
  setFilteredTabs(
    googleTabs
      .map(t => formatFolderContents(t, user))
      .filter(t => !projectTabs.map(pt => formatTabName(pt)).includes(formatTabName(t)) 
        && formatTabName(t).toLowerCase().includes(searchTerm.toLowerCase()))
  )
}, [googleTabs, projectTabs, searchTerm])

useEffect(() => {
  console.log('filtered tabs:', {
    googleTabs, projectTabs, filteredTabs
  })
}, [filteredTabs])

// useEffect(() => setFilteredTabs(googleTabs), [googleTabs])
function pick() {
  console.log('pick', selectedId)
  addTabToProject(selectedId)
  
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
    <div style={{display: 'flex', flexDirection: 'column'}}>
      <input style={{width: '100%', }} onChange={onSearch} value={searchTerm}></input>
      <select style={{width: '100%', height: '100%'}} size='5' onChange={onSelect}>
      {filteredTabs
        .sort((a, b) => a['artistName']+a['songName'] < b['artistName']+a['songName'] ? -1 : 1)
        .map(tab => {
          // console.log('filtered tab:', tab)
          return (<option key={tab.id} selected={tab.googleDocsId==selectedId} id={tab.googleDocsId} value={tab.googleDocsId}>
            {formatTabName(tab)}
          </option>)
        })
      }
    </select>
  </div>}
/>
}


