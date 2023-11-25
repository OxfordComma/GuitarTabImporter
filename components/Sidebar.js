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
    setDelete,
    onClickSidebarItem,
  }) {
  return (
    <div
      className={styles['sidebar-item']} 
      onClick={(e) => {
        console.log('setSidebarItemId', datum, sidebarItemId)
        setSidebarItemId(datum.id)
        onClickSidebarItem(datum.id)
      } }
      style={{ 
        'opacity': enabled ? 1 : 0.6,
        'border': (sidebarItemId == null) ? '1px solid green' : 
          (datum['id'] == sidebarItemId) ? '1px solid pink' : null,
      }}>
        {content(datum)}
    </div>
  )
}

function NewSidebarItem ({ sidebarItems, setSidebarItems, setSidebarItemId, setCreateNew, setSortBy }) {
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
      capo: 0,
      tuning: 'EADGBe',
    }
    // setSortBy('createdTime descending')
    setCreateNew(false)
    setSidebarItems([
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

function SearchBar({ onChange, searchTerm }) {
  return (<div>
    <input style={{width: '100%'}} value={searchTerm} onChange={onChange}></input>
  </div>)
}

export default function Sidebar ({ 
    sidebarItems, 
    setSidebarItems, 
    setDeleteItem, 
    sidebarItemId, 
    setSidebarItemId,
    sidebarSortBy='index',
    setSidebarSortBy=()=>{},
    createNewSidebarItem=false,
    setCreateNewSidebarItem=()=>{},
    search=false,
    searchFunction= d => d.id,
    
    itemIsEnabled = d => true,
    SidebarItemComponent,
    menuBar,
    onClickSidebarItem = () => {},
  }) {
  let [filteredSidebarItems, setFilteredSidebarItems] = useState(sidebarItems)
  let [sortBy, setSortBy] = useState(sidebarSortBy)
  let [showSearchBar, setShowSearchBar] = useState(search)
  let [searchTerm, setSearchTerm] = useState('')
  
  useEffect(() => setSidebarSortBy(sortBy), [sortBy])
  
  useEffect(() => {
    setFilteredSidebarItems(sidebarItems)
  }, [sidebarItems])

  useEffect(() => {
    let newSidebarItems = sidebarItems.filter(item => searchFunction(item).toLowerCase().includes(searchTerm.toLowerCase()))
    setFilteredSidebarItems(newSidebarItems)
  }, [sidebarItems, searchTerm])

  let onSearchBarChange = function(e) { 
    e.preventDefault(); 
    setSearchTerm(e.target.value)
    
  }

  let sidebarItemContent = function( datum ) {
    console.log(datum)
    return [
      <div key='id'>{datum.id}</div>
    ]
  }

  return (
    <div className={styles['sidebar']}>
      <div className={styles['menu-bar']}>
        {menuBar ? menuBar : <div></div>}
      </div>
      <div className={styles['sidebar-items']}>
        {
          showSearchBar ? 
            <SearchBar
              searchTerm={searchTerm}
              onChange={onSearchBarChange}
            /> : 
            null
        }
        {createNewSidebarItem ? 
          <NewSidebarItem
            datum={{}}
            sidebarItems={sidebarItems}
            setSidebarItems={setSidebarItems}
            setCreateNew={setCreateNewSidebarItem}
            setSortBy={setSortBy}
            setSidebarItemId={setSidebarItemId}
          /> : 
          null}
        {filteredSidebarItems.map(d => (
          <SidebarItem
            key={d.id} 
            datum={d} 
            sidebarItemId={sidebarItemId}
            setSidebarItemId={setSidebarItemId}
            setDeleteItem={setDeleteItem}
            content={SidebarItemComponent ?? sidebarItemContent}
            enabled={itemIsEnabled(d)}
            onClickSidebarItem={onClickSidebarItem}
          />)
        )}
      </div>
    </div>
  )
}

