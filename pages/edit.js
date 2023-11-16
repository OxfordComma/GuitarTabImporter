import Header from '../components/Header.js'
import Sidebar from '../components/Sidebar.js'
import { MenuBar, Dropdown } from 'quantifyjs'

// import Sidebar from '../components/TabEditorSidebar.js'
import Editor from '../components/TabEditor.js'

import styles from '../styles/edit.module.css'
import menuBarStyles from '../styles/MenuBar.module.css'

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
      
      <div style={{display: 'flex', justifyContent: 'right'}}>
        <label for='action'></label>
        <button name='action' onClick={action}>{actionLabel}</button>

        <label for='action'></label>
        <button name='close' onClick={close}>close</button>
       </div>
    </div>
  </div> : null)
}

function CreateTab({ show, }) {

}

function ConfirmDelete ({ show, tabs, setTabs, tabId, setDeleteTab }) {
	let tab = tabs.find(t => t.id == tabId)

	let deleteTab = async () => {
		let deletedTab = await fetch('/api/tab?tabid='+tabId, {
			method: 'DELETE',
		}).then(r => r.json())

    console.log('deleted:', deletedTab)
		console.log('updating this tab:', tab)
		setDeleteTab(null)
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
      <button onClick={() => setDeleteTab(null)}>no</button>
      <button onClick={() => deleteTab(tabId)}>yes</button>
    </div>
  </div> : null)
}

function EditTabWindow({ 
  tabs, 
  setTabs, 
  tabId, 
  editTab,
  setEditTab, 
  styles,
}) {
const show = editTab != null
const [tab, setTab] = useState(tabs.find(t => t.id == tabId))

useEffect(() => {
  setTab(tabs.find(t => t.id == tabId))
}, [tabs, tabId])

function setArtistName(val) {
  // event.preventDefault()
  setTab({
    ...tab,
    artistName: val
  })
}

function setSongName(val) {
  // event.preventDefault()
  setTab({
    ...tab,
    songName: val
  })
}

function setCapo(val) {
  // event.preventDefault()
  setTab({
    ...tab,
    capo: val
  })
}

function setTuning(val) {
  // event.preventDefault()
  setTab({
    ...tab,
    tuning: val
  })
}

async function save(event) {
  event.preventDefault()

  // await fetch(`/api/tab`, {
  //   method: 'POST',
  //   body: JSON.stringify(tab)
  // })

  // console.log({
  //   tabs,
  //   tabId,
  //   t: tbs.map(t => t.id).includes(tabId),
  // })

  if (tabs.map(p => p.id).includes(tabId)) {
    // console.log('replacing', )
    setTabs(tabs.map(t => t.id == tabId ? tab : t))
  }
  else {
    console.log('appending')

    setProjects([...tabs, tab])
  }

  console.log('saved ', tab)
  close(event)
}

function close(event) {
  event.preventDefault()
  setEditTab(null)
}

// return (show ? <div className={styles['fullscreen-background']}>
  // <div className={styles['fullscreen-window']}>
function InfoRow({
  label, value, items, disabled=false, onChange=() => {},
}) {
  return (<div style={{display: 'flex'}}>
    <label style={{flex: 1}} htmlFor={label}>{label}</label>
    {items!=undefined ? 
      <Dropdown items={items} selected={value} onDropdownChange={onChange}/> : 
      <input style={{flex: 1}} type="text" name={label} value={value} disabled={disabled} onChange={onChange}/>}
  </div>)
}

// tab['tabText'].match(/capo (\d)/i) ? tab['tabText'].match(/capo (\d)/i)[1] : 0
return (<FullscreenWindow
  show={show}
  action={save}
  close={close}
  actionLabel='save'
  content={
    <div>
      {
        tab ? [
          <InfoRow label='id' value={tab?.id} disabled={true}/>,
          <InfoRow label='artistName' value={tab?.artistName} onChange={setArtistName} disabled={false}/>,
          <InfoRow label='songName' value={tab?.songName} onChange={setSongName} disabled={false}/>,
          <InfoRow label='capo' value={tab?.capo ?? 0} onChange={setCapo}  disabled={false}/>,
          <InfoRow label='tuning' value='EADGBe' items={['EADGBe', 'DADGBe', 'D#A#D#F#A#d#']} value={tab?.tuning} onChange={setTuning} disabled={false}/>,
        ] : null
      }
      {/*
        tab != null ? Object.entries(tab).map(entry => {
          let key = entry[0]
          let value = entry[1]
          console.log({key, value})
          return (<div style={{display: 'flex'}}>
            <label style={{flex: 1}} htmlFor={key}>{key}</label>
            <input style={{flex: 1}} type="text" name={key} value={value} disabled/>
          </div>)
        }) : null
      */}
    </div>
  }
  />)
}

export default function Edit(props) {
  const { data: session, status } = useSession()

  let [folder, setFolder] = useState('')
  let [url, setUrl] = useState('') 
  let [tabs, setTabs] = useState([])
  let [sidebarItemId, setSidebarItemId] = useState(null)
  let [user, setUser] = useState(null)
  let [editTab, setEditTab] = useState(null)
  let [deleteTab, setDeleteTab] = useState(null)

  let [sidebarSortBy, setSidebarSortBy] = useState(null)
  let [createNewSidebarItem, setCreateNewSidebarItem] = useState(false)
  let [showSidebarSearchBar, setShowSidebarSearchBar] = useState(true)

  useEffect( () => {
  	console.log('delete tab:', deleteTab)
  }, [deleteTab])

  useEffect( () => {
    const getData = async () => {
    let user = await fetch('/api/user').then(r => r.json())
    console.log('user:', user)

    let userTabs = await fetch('/api/tabs?userid=' + user._id).then(r => r.json())
    console.log('userTabs:', userTabs)

    let folderContents = await fetch('/api/folder?folder=' + user.folder).then(r => r.json())
     	folderContents = folderContents.map(fc => {
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
     	}).filter(fc => !userTabs.map(ut => ut['googleDocsId']).includes(fc['googleDocsId']))

     	console.log('folderContents:', folderContents)

     	let allTabs = [...userTabs.reverse(), ...folderContents]
     	allTabs = allTabs.map((at, i) => {
      	at['index'] = i
      	return at
     	})
     	console.log('allTabs:', allTabs)
    	
    	setUser(user)
      setTabs(allTabs)
    }

    getData()
  }, [] )

  useEffect( () => { 
  	console.log('sidebar item id changed to:', sidebarItemId)

  }, [sidebarItemId] )

  useEffect(() => {
    console.log('sidebarSortBy:', sidebarSortBy)
    let newSidebarItems = tabs.slice(0).sort((a, b) => {
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
    setTabs(newSidebarItems)
  }, [sidebarSortBy])


	return (

		<div className={styles.container}>
			<ConfirmDelete 
				show={deleteTab != null} 
				tabs={tabs} 
				setTabs={setTabs}
				tabId={deleteTab}
				setDeleteTab={setDeleteTab}
      />
      <EditTabWindow
        tabs={tabs}
        tabId={sidebarItemId}
        setTabs={setTabs}
        editTab={editTab}
        setEditTab={setEditTab}
        styles={styles}
      />
			<div className={styles.sidebar}>
				<Sidebar
					sidebarItems={tabs}
					setSidebarItems={setTabs}
					sidebarItemId={sidebarItemId}
					setSidebarItemId={setSidebarItemId}
					setDeleteTab={setDeleteTab}
          createNewSidebarItem={createNewSidebarItem}
          setCreateNewSidebarItem={setCreateNewSidebarItem}
          search={showSidebarSearchBar}
          searchFunction={d => `${d.artistName} - ${d.songName}`}
          itemIsEnabled={d => d?.tabText != ''}
          SidebarItemComponent={(datum) => {
            return ([
              // <div
              // className={styles['sidebar-item']} 
              // onClick={() => {
              //   console.log('setSidebarItemId', datum, sidebarItemId)
              //   setSidebarItemId(datum.id)} 
              // }
              // style={{ 
              //   'opacity': datum.tabText == '' ? 0.6 : 1,
              //   'border': (sidebarItemId == null) ? '1px solid green' : 
              //     (datum['id'] == sidebarItemId) ? '1px solid pink' : null,
              // }}
              // >
                <div>{datum.artistName} - {datum.songName}</div>,
                <div style={{marginLeft: 'auto'}}>{datum._id ? '✓' : null}</div>,
                <div style={{width: '10px'}}>{datum.googleDocsId ? 'G' : null}</div>,
                <div style={{width: '10px'}}id={datum.id} onClick={e => {e.stopPropagation(); setDeleteTab(e.target.id)}} >{datum._id ? '♻' : null}</div>,
            // </div>
            ])
          }}
          menuBar={
            <MenuBar
              items={
                {
                  file: [{
                    title: 'new tab',
                    onClick: () => setCreateNewSidebarItem(true),
                  },{
                    title: 'edit tab',
                    onClick: () => setEditTab(true),
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
          }
				/>
			</div>
			<div className={styles.editor}>
				<Editor
					tabs={tabs}
          tabId={sidebarItemId}
					setTabs={setTabs}
          userId={user?._id}
				/>
			</div>			
		</div>
	)
}

