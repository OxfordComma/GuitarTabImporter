import Header from '../components/Header.js'
import MenuBar from '../components/MenuBar.js'

import styles from '../styles/TabEditorSidebar.module.css'
import { useSession, signIn, signOut } from "next-auth/react"
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'


function NewSidebarItem ({ sidebarItems, setTabs, setSidebarItems, setSidebarItemId, setCreateNew, setSortBy }) {
  let [artistName, setArtistName] = useState('')
  let [songName, setSongName] = useState('')

  function addTab() {
    console.log('adding tab?')

    let newItem = {
      id: Math.random().toString(16).slice(2),
      googleDocsId: null,
      tabText: '',
      tabName: artistName + ' - ' + songName,
      artistName: artistName,
      songName: songName,
      holiday: false,
      draft: false,
      uri: null,
      createdTime: new Date(),
      starred: false,
    }
    // setSortBy('createdTime descending')
    setCreateNew(false)
    setTabs([
      newItem,
      ...sidebarItems//.sort((a, b) => a.createdTime < b.createdTime ? 1 : -1 ),

    ])
    setSidebarItemId(newItem.id)

  }
  return (
    <div className={styles['sidebar-item']}>
      <input 
        placeholder='artist name'
        value={artistName}
        onChange={e => setArtistName(e.target.value)}
      />
      <input 
        placeholder='song name'
        value={songName}
        onChange={e => setSongName(e.target.value)}
      />
      <button onClick={() => setCreateNew(false)}>✗</button>
      <button onClick={() => addTab()}>✓</button>
    </div>
  )
}


function SidebarItem ({ datum, sidebarItemId, setSidebarItemId, setDeleteTab}) {
  return (
    <div
      className={styles['sidebar-item']} 
      onClick={() => {
        console.log('setSidebarItemId', datum, sidebarItemId)
        setSidebarItemId(datum.id)} 
      }
      style={{ 
        'opacity': datum.tabText == '' ? 0.6 : 1,
        'border': (sidebarItemId == null) ? '1px solid green' : 
          (datum['id'] == sidebarItemId) ? '1px solid pink' : null,
      }}>
        <div>{datum.artistName} - {datum.songName}</div>
        <div style={{marginLeft: 'auto'}}>{datum._id ? '✓' : null}</div>
        <div style={{width: '10px'}}>{datum.googleDocsId ? 'G' : null}</div>
        <div style={{width: '10px'}}id={datum.id} onClick={e => {e.stopPropagation(); setDeleteTab(e.target.id)}} >{datum._id ? '♻' : null}</div>
    </div>
  )
}

export default function Sidebar ({ tabs, setTabs, setDeleteTab, sidebarItemId, setSidebarItemId }) {
  let [sortBy, setSortBy] = useState('index')
  let [sidebarItems, setSidebarItems] = useState(tabs)
  let [createNew, setCreateNew] = useState(false)

  useEffect(() => {
    let newSidebarItems = tabs
  // .map((datum, index) => {
  //     // console.log(datum)
  //     let draft = datum['tabName'].match('[DRAFT]') == null
  //     let holiday = datum['tabName'].match('[HOLIDAY]') == null
  //     let artistName = datum['tabName'].split(' - ')[0]
  //       .replace('\[DRAFT\] ', '')
  //       .replace('\[HOLIDAY\] ', '')
  //     let uri = datum['tabName'].match('\{(.+)\}')
  //     // To avoid repeating the regex
  //     if (uri) uri = uri[1]

  //     let songName = datum['tabName'].split(' - ')[1].replace(`\{${uri}\}`, '')
  //     let createdTime = Date.parse(datum['createdTime'])
  //     // let starred = datum['starred']
  //     return {
  //       ...datum,
  //       index: index,
  //       draft: draft,
  //       holiday: holiday,
  //       artistName: artistName,
  //       uri: uri,
  //       songName: songName,
  //       createdTime: createdTime,
  //     }
  //   })

    console.log('tabs changed, new sidebar items:', newSidebarItems)
    setSidebarItems(newSidebarItems)
  }, [tabs])

  useEffect(() => {
    console.log('sortBy:', sortBy)
    let newSidebarItems = sidebarItems.sort((a, b) => {
      if (sortBy == 'index') {
        return a['index'] > b['index'] ? 1 : -1
      }
      if (sortBy == 'artist ascending') {
        return a['artistName'].toLowerCase() > b['artistName'].toLowerCase() ? 1 : -1
      }
      if (sortBy == 'artist descending') {
        return a['artistName'].toLowerCase() < b['artistName'].toLowerCase() ? 1 : -1
      }
      if (sortBy == 'song ascending') {
        return a['songName'].toLowerCase() > b['songName'].toLowerCase() ? 1 : -1
      }
      if (sortBy == 'song descending') {
        return a['artistName'].toLowerCase() < b['artistName'].toLowerCase() ? 1 : -1
      }
      if (sortBy == 'createdTime descending') {
        return a['createdTime'] < b['createdTime'] ? 1 : -1
      }
      if (sortBy == 'createdTime ascending') {
        return a['createdTime'] > b['createdTime'] ? 1 : -1
      }

    })
    console.log('new sidebar items:', newSidebarItems)
    setSidebarItems(newSidebarItems)
  }, [sortBy])


  return (
    <div className={styles['sidebar']}>
      <div className={styles['menu-bar']}>
        <MenuBar
          menuItems={
            {
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
        />
        <button className={styles['add-tab-button']}  onClick={() => setCreateNew(true)}>+</button>
      </div>
      <div className={styles['sidebar-items']}>
        {createNew ? 
          <NewSidebarItem
            datum={{}}
            sidebarItems={sidebarItems}
            setTabs={setTabs}
            setSidebarItems={setSidebarItems}
            setCreateNew={setCreateNew}
            setSortBy={setSortBy}
            setSidebarItemId={setSidebarItemId}
          />
         : null}
        {sidebarItems.map(d => (
          <SidebarItem
            key={d} 
            datum={d} 
            sidebarItemId={sidebarItemId}
            setSidebarItemId={setSidebarItemId}
            setDeleteTab={setDeleteTab}
          />)
        )}
      </div>
    </div>
  )
}