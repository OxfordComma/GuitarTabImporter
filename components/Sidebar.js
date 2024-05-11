import Header from '../components/Header.js'


import styles from '../styles/Sidebar.module.css'
import { useSession, signIn, signOut } from "next-auth/react"
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'


export default function Sidebar ({ 
    sidebarItems, 
    setSidebarItems, 
    // setDeleteItem, 
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
    addSidebarItem,
    pinnedItems,
    setPinnedItems,
    pinnedItemFunction= d => d.id,
  }) {
  let [filteredSidebarItems, setFilteredSidebarItems] = useState(sidebarItems)
  let [pinnedSidebarItems, setPinnedSidebarItems] = useState(pinnedItems?.map(p => sidebarItems.find(s => s.id == p)) ?? [])
  let [sortBy, setSortBy] = useState(sidebarSortBy)
  let [showSearchBar, setShowSearchBar] = useState(search)
  let [searchTerm, setSearchTerm] = useState('')
  
  useEffect(() => setSidebarSortBy(sortBy), [sortBy])
  
  // useEffect(() => {
  //   setFilteredSidebarItems(sidebarItems)
  // }, [sidebarItems])

  useEffect(() => {
    let newSidebarItems = sidebarItems
      .filter(item => searchFunction(item).toLowerCase().includes(searchTerm.toLowerCase()))

    if (pinnedItems) {
      newSidebarItems = newSidebarItems
        .filter(item => !pinnedItems.includes(pinnedItemFunction(item)))

      let newPinnedSidebarItems = sidebarItems
        .filter(item => searchFunction(item).toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(item => pinnedItems.includes(pinnedItemFunction(item)))
      setPinnedSidebarItems(newPinnedSidebarItems)
    }    

    setFilteredSidebarItems(newSidebarItems)
    

    console.log('pinned items', pinnedItems)
  }, [sidebarItems, searchTerm, pinnedItems])

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
    <div className={styles['sidebar-container']}>
      <div className={styles['menu-bar']}>
        {menuBar ? menuBar : <div></div>}
      </div>
      <div className={styles['sidebar-content']}>
        {
          showSearchBar ? 
          <SearchBar
            searchTerm={searchTerm}
            onChange={onSearchBarChange}
          /> : 
          null
        }
        <div className={styles['sidebar-items']}>
          {createNewSidebarItem ? 
            <NewSidebarItem
              datum={{}}
              sidebarItems={sidebarItems}
              setSidebarItems={setSidebarItems}
              setCreateNew={setCreateNewSidebarItem}
              setSortBy={setSortBy}
              setSidebarItemId={setSidebarItemId}
              addSidebarItem={addSidebarItem}
            /> : 
            null}
          <div className={styles['pinned-sidebar-items']}>
            {pinnedSidebarItems.map(d => (
              <SidebarItem
                key={d.id} 
                datum={d} 
                sidebarItemId={sidebarItemId}
                setSidebarItemId={setSidebarItemId}
                content={SidebarItemComponent ?? sidebarItemContent}
                enabled={itemIsEnabled(d)}
                onClickSidebarItem={onClickSidebarItem}
              />)
            )}
          </div>
          {filteredSidebarItems.map(d => (
            <SidebarItem
              key={d.id} 
              datum={d} 
              sidebarItemId={sidebarItemId}
              setSidebarItemId={setSidebarItemId}
              content={SidebarItemComponent ?? sidebarItemContent}
              enabled={itemIsEnabled(d)}
              onClickSidebarItem={onClickSidebarItem}
            />)
          )}
        </div>
      </div>
    </div>
  )
}




function SidebarItem ({ 
    datum, 
    content,
    enabled=true,
    sidebarItemId, 
    setSidebarItemId, 
    // setDeleteItem,
    onClickSidebarItem,
    style={}
  }) {
  return (
    <div
      style={style}
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

function NewSidebarItem ({ 
    sidebarItems, 
    setSidebarItems, 
    setSidebarItemId, 
    addSidebarItem,
    setCreateNew, 
    setSortBy
}) {
  let [artistName, setArtistName] = useState('')
  let [songName, setSongName] = useState('')

  
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
      <button onClick={() => {addSidebarItem(artistName, songName); setCreateNew(false); }}>✓</button>
    </div>
  )
}

function SearchBar({ onChange, searchTerm }) {
  return (<div>
    <input style={{width: '100%'}} value={searchTerm} onChange={onChange}></input>
  </div>)
}
