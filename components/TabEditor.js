import styles from '../styles/TabEditor.module.css'
import menuBarStyles from '../styles/MenuBar.module.css'
import Link from 'next/link'
import React from 'react'
import { Dropdown } from 'quantifyjs'
import MenuBar from './MenuBar.js'
import { useState, useEffect } from 'react'

import { formatRawTabs } from '../lib/tabhelper.js'

const data = [{
      id: 'id1',
      time: 1,
      distance: 1,
      quality: 100,
      category: 'red',
      date: new Date(2023, 0, 1),
    }, {
      id: 'id1',
      time: 1,
      distance: 1,
      quality: 90,
      category: 'red',
      date: new Date(2023, 0, 1),
    }, {
      id: 'id1',
      time: 1,
      distance: 1,
      quality: 95,
      category: 'red',
      date: new Date(2023, 0, 1),
    }, {
      id: 'id1',
      time: 1,
      distance: 1,
      quality: 85,
      category: 'red',
      date: new Date(2023, 0, 1),
    }, {
      id: 'id1',
      time: 1,
      distance: 1,
      quality: 80,
      category: 'red',
      date: new Date(2023, 0, 1),
    }, {
      id: 'id2', 
      time: 2,
      distance: 3,
      quality: 75,
      category: 'blue',
      date: new Date(2023, 1, 1),
    }, {
      id: 'id3',
      time: 3,
      distance: 3,
      quality: 25,
      category: 'red',
      date: new Date(2023, 2, 1),
    }, {
      id: 'id4', 
      time: 4,
      distance: 6,
      quality: 75,
      category: 'blue',
      date: new Date(2023, 3, 1),
    }, {
      id: 'id5', 
      time: 5,
      distance: 7,
      quality: 50,
      category: 'red',
      date: new Date(2023, 4, 1),
  }]

function PrintHelper({ tabText, setTabText }) {
  return (
    <p> 
      className={styles['text-area']}
      value={tabText}
      readOnly={false}
      onChange={e => setTabText(e.target.value)}
    </p>)
}

function TabTextArea({ tabText, setTabText}) {
  return (
    <textarea 
      className={styles['text-area']}
      value={tabText}
      readOnly={false}
      onChange={e => setTabText(e.target.value)}
    />)
}

export default function Editor ({ 
  sidebarItemId, 
  userId,
  tabs, 
  setTabs,
}) {
  let [tabText, setTabText] = useState('')
  async function importTab() {

    if (!sidebarItemId)
      return

    let sidebarTab = tabs.find(t => t['id'] == sidebarItemId)
    let tabText = await fetch('api/document?documentid='+sidebarTab.googleDocsId)
      .then(r => r.json())
    console.log(tabText)
    setTabText(tabText)

  }


  async function saveTab() {
    // console.log('SAVE TAB')
    let sidebarTab = tabs.find(t => t['id'] == sidebarItemId)

    let saveResponse = await fetch('api/tab', {
      method: 'POST',
      body: JSON.stringify({
        id: sidebarTab.id,
        userId: userId,
        googleDocsId: sidebarTab.googleDocsId,
        tabText: tabText,
        tabName: sidebarTab.tabName,
        draft: sidebarTab.draft,
        holiday: sidebarTab.holiday,
        artistName: sidebarTab.artistName,
        uri: sidebarTab.uri,
        songName: sidebarTab.songName,
        createdTime: sidebarTab.createdTime,
        starred: sidebarTab.starred,
      })
    }).then(r => r.json())
    console.log('saveResponse:', saveResponse)
    if (saveResponse.ok == 1) {
      setTabs(
        tabs.map(t => {
          if (t.id == sidebarTab.id) {
            t['tabText'] = tabText
            t['_id'] = saveResponse.value?._id ?? saveResponse.lastErrorObject.upserted
          }
          return t
        })
      )
    }
  }

  async function exportTab() {
    console.log(tabs)
    let sidebarTab = tabs.find(t => t['id'] == sidebarItemId)
    console.log('exporting:', sidebarTab)
    let user = await fetch('api/user').then(r => r.json())
    let account = await fetch(`/api/account?userid=${userId}`).then(r => r.json())

    let saveResponse = await fetch('api/create', {
      method: 'POST',
      body: JSON.stringify({
        tab: {
          ...sidebarTab,
          tabText: tabText,
        },
        account: account,
        folder: user.folder,
        // id: sidebarTab.id,
        // userId: sidebarTab.userId,
        // googleDocsId: sidebarTab.googleDocsId,
        // tabText: tabText,
        // tabName: sidebarTab.tabName,
        // draft: sidebarTab.draft,
        // holiday: sidebarTab.holiday,
        // artistName: sidebarTab.artistName,
        // uri: sidebarTab.uri,
        // songName: sidebarTab.songName,
        // createdTime: sidebarTab.createdTime,
        // starred: sidebarTab.starred,
      })
    }).then(r => r.json())  

    console.log(saveResponse)
    tabs = tabs.map(t => {
      if (t['id'] == sidebarItemId) {
        t['googleDocsId'] = saveResponse['googleDocsId']
      }
      return t
    })
    // console.log(tabs)
    saveTab()

    setTabs(tabs)
  }
  
  function formatTab() {
    setTabText(
      formatRawTabs(tabText)
    )

  }


  useEffect(() => {
    async function updateTab() {
      let sidebarTab = tabs.find(t => t['id'] == sidebarItemId)

      let text = sidebarTab?.tabText

      if (text != undefined) {
        console.log('Loaded tab text already!')
        setTabText(text)
        return
      }

      else {
        setTabText('')
      }
    }

    updateTab();
  }, [sidebarItemId])

  return (
    <div className={styles['container']}>
      {/*<NewMenuBar/>*/}
       <Dropdown
        options={Object.keys(data[0])}
        selected={'time'}
        // onDropdownChange={setPlotSize}
        label='size'
      />
      <MenuBar
        menuItems={{
          'file': [{ title: 'save tab', onClick: saveTab, }],
          'import': [{ title: 'import tab from Google Docs', onClick: importTab, }],
          'export': [{ title: 'export tab to Google Docs', onClick: exportTab, disabled: false }],
          'format': [{ title: 'format tab text', onClick: formatTab, }],
        }}
        styles={menuBarStyles}
      />
      {/*<TabEditBar 
        sidebarItemId={sidebarItemId}
        tabText={tabText}
        setTabText={setTabText}
        userId={userId}
        tabs={tabs}
        setTabs={setTabs}/>*/}
      <TabTextArea 
        tabText={tabText}
        setTabText={setTabText}/>
      <PrintHelper
        tabText={tabText}
      />
    </div>
  )
}