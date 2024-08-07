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
    searchFunction= d => d._id,
    keyFunction = d => d._id,
    itemIsEnabled = d => true,
    SidebarItemComponent,
    menuBar,
    onClickSidebarItem = () => {},
    addSidebarItem,
    pinnedItems,
    setPinnedItems,
    pinnedItemFunction= d => d._id,
  }) {
  let [filteredSidebarItems, setFilteredSidebarItems] = useState(sidebarItems)
  let [pinnedSidebarItems, setPinnedSidebarItems] = useState(pinnedItems?.map(p => sidebarItems.find(s => keyFunction(s) == p)) ?? [])
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
    
    // console.log('pinned items', pinnedItems)
  }, [sidebarItems, searchTerm, pinnedItems])

  let onSearchBarChange = function(e) { 
    e.preventDefault(); 
    setSearchTerm(e.target.value)
    
  }

  let sidebarItemContent = function( datum ) {
    console.log(datum)
    return [
      <div key='id'>{keyFunction(datum)}</div>
    ]
  }

  return (
    <div className={styles['sidebar-container']}>
      {menuBar ? <div className={styles['menu-bar']}>
        {menuBar}
      </div> : <div></div>}
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
              keyFunction={keyFunction}
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
                key={keyFunction(d)} 
                keyFunction={keyFunction}
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
              key={keyFunction(d)} 
              keyFunction={keyFunction}
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
    style={},
    keyFunction
  }) {
  return (
    <div
      // style={style}
      className={styles['sidebar-item']} 
      onClick={(e) => {
        console.log('setSidebarItemId', datum, sidebarItemId)
        setSidebarItemId(keyFunction(datum))
        onClickSidebarItem(keyFunction(datum))
      } }
      style={{ 
        opacity: enabled ? 1 : 0.6,
        color: (keyFunction(datum) == sidebarItemId) ? '#222222' : undefined,
        backgroundColor: (keyFunction(datum) == sidebarItemId) ? 'white' : undefined,
        transition: '100ms background-color ease-in',
        // 'border': (sidebarItemId == null) ? '1px solid transparent' : 
        //   (keyFunction(datum) == sidebarItemId) ? '1px solid pink' : null,
        ...style,
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
        className={styles['new-sidebar-item-input']}
        placeholder='artist name'
        value={artistName}
        onChange={e => setArtistName(e.target.value)}
      />
      <input 
        className={styles['new-sidebar-item-input']}
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
  return (<div className={styles['search-bar']}>
    <div style={{paddingRight: '10px'}}>🔎</div>
    <input style={{width: '100%'}} value={searchTerm} onChange={onChange}></input>
  </div>)
}
