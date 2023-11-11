import Header from '../components/Header.js'


import styles from '../styles/TabEditorSidebar.module.css'
import { useSession, signIn, signOut } from "next-auth/react"
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'



function SidebarItem ({ 
    datum, 
    content,
    enabled=true,
    sidebarItemId, 
    setSidebarItemId, 
    setDelete
  }) {
  return (
    <div
      className={styles['sidebar-item']} 
      onClick={() => {
        console.log('setSidebarItemId', datum, sidebarItemId)
        setSidebarItemId(datum.id)} 
      }
      style={{ 
        'opacity': enabled ? 0.6 : 1,
        'border': (sidebarItemId == null) ? '1px solid green' : 
          (datum['id'] == sidebarItemId) ? '1px solid pink' : null,
      }}>
        {content(datum)}
    </div>
  )
}

export default function Sidebar ({ 
    SidebarItemComponent,
    sidebarItems, 
    setSidebarItems, 
    setDeleteItem, 
    sidebarItemId, 
    setSidebarItemId,
    menuBar
  }) {
  let [sortBy, setSortBy] = useState('index')
  // let [sidebarItems, setSidebarItems] = useState(tabs)
  let [createNew, setCreateNew] = useState(false)

  // useEffect(() => {
  //   let newSidebarItems = tabs

  //   console.log('tabs changed, new sidebar items:', newSidebarItems)
  //   setSidebarItems(newSidebarItems)
  // }, [tabs])

  // useEffect(() => {
  //   console.log('sortBy:', sortBy)
  //   let newSidebarItems = sidebarItems.sort((a, b) => {
  //     if (sortBy == 'index') {
  //       return a['index'] > b['index'] ? 1 : -1
  //     }
  //     if (sortBy == 'artist ascending') {
  //       return a['artistName'].toLowerCase() > b['artistName'].toLowerCase() ? 1 : -1
  //     }
  //     if (sortBy == 'artist descending') {
  //       return a['artistName'].toLowerCase() < b['artistName'].toLowerCase() ? 1 : -1
  //     }
  //     if (sortBy == 'song ascending') {
  //       return a['songName'].toLowerCase() > b['songName'].toLowerCase() ? 1 : -1
  //     }
  //     if (sortBy == 'song descending') {
  //       return a['artistName'].toLowerCase() < b['artistName'].toLowerCase() ? 1 : -1
  //     }
  //     if (sortBy == 'createdTime descending') {
  //       return a['createdTime'] < b['createdTime'] ? 1 : -1
  //     }
  //     if (sortBy == 'createdTime ascending') {
  //       return a['createdTime'] > b['createdTime'] ? 1 : -1
  //     }

  //   })
  //   console.log('new sidebar items:', newSidebarItems)
  //   setSidebarItems(newSidebarItems)
  // }, [sortBy])

  let sidebarItemContent = function( datum ) {
    console.log(datum)
    return [
      <div>{datum.id}</div>
    ]
  }

  return (
    <div className={styles['sidebar']}>
      <div className={styles['menu-bar']}>
        {menuBar ? menuBar : <div></div>}
      </div>
      <div className={styles['sidebar-items']}>
        {sidebarItems.map(d => (
          <SidebarItem
            key={d.id} 
            datum={d} 
            sidebarItemId={sidebarItemId}
            setSidebarItemId={setSidebarItemId}
            setDeleteItem={setDeleteItem}
            content={SidebarItemComponent ?? sidebarItemContent}
          />)
        )}
      </div>
    </div>
  )
}