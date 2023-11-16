import styles from '../styles/TabEditor.module.css'
import Link from 'next/link'
import React from 'react'
import {MenuBar} from 'quantifyjs'
import menuBarStyles from '../styles/MenuBar.module.css'
// import MenuBar from './MenuBar.js'

import { useState, useEffect } from 'react'

import { formatRawTabs } from '../lib/tabhelper.js'

function TabTextArea({ tabText, setTabText, fontSize }) {
  return (
    <textarea 
      className={styles['text-area']}
      value={tabText}
      readOnly={false}
      onChange={setTabText}
      style={{ fontSize: fontSize }}
    />)
}

function StyleEditor({
  fontSize,
  setFontSize,
}) {
  return (
    <div style={{display:'flex',}}>
      <button onClick={() => setFontSize(fontSize+1)}>+</button>
      <button onClick={() => setFontSize(fontSize-1)}>-</button>
      <div>{fontSize}</div>
    </div>
  )
}

function TitleBar({ tab }) {
  return (
    <div style={{marginLeft: 'auto', marginRight: 'auto'}}>
      {/*{tab ? `${tab?.artistName} - ${tab?.songName}` : ''}*/}
      {tab ? `${tab?.artistName.replace(/ /g, '').toLowerCase()}_${tab.songName.replace(/ /g, '').toLowerCase()}.tab` : ''}
    </div>
  )
}

function DetailBar({ tab }) {
  let showTuning = tab?.tuning && tab.tuning != 'EADGBe'
  let showCapo = tab?.capo && parseInt(tab.capo) > 0
  return (
    <div style={{width: '250px', textAlign: 'right'}}>
      {showTuning ? `${tab.tuning}` : ''}
      {showTuning && showCapo ? ', ' : ''}
      {showCapo ? `capo ${tab.capo}` : ''}
    </div>
  )
}

export default function Editor ({ 
  tabId, 
  userId,
  tabs, 
  setTabs,
}) {
  // const [tabText, setTabText] = useState('')
  const [fontSize, setFontSize] = useState(12)
  const [tab, setTab] = useState(tabs.find(t => t['id'] == tabId) ?? null)

  useEffect(() => {
    // async function updateTab() {
    let newTab = tabs.find(t => t['id'] == tabId)
    setTab(newTab);
    // let text = tab.tabText


    // if (text != undefined) {
    //   console.log('Loaded tab text already!')
    //   setTabText(text)
    //   return
    // }

    // else {
    //   setTabText('')
    // }
    // }

    // updateTab();
  }, [tabId, tabs])

  
  async function importTab() {
    if (!tabId)
      return

    // let sidebarTab = tabs.find(t => t['id'] == tabId)
    let tabText = ''
    if (tab.googleDocsId){
      tabText = await fetch('api/document?documentid='+tab.googleDocsId)
      .then(r => r.json())
    
      console.log('google doc text:', tabText)
    }

    setTab({
      ...tab,
      tabText: tabText
    })
  }

  async function saveTab() {
    // console.log('SAVE TAB')
    // let sidebarTab = tabs.find(t => t['id'] == tabId)
    let sidebarTab = tab

    let saveResponse = await fetch('api/tab', {
      method: 'POST',
      body: JSON.stringify({
        id: sidebarTab.id,
        userId: userId,
        googleDocsId: sidebarTab.googleDocsId,
        tabText: sidebarTab.tabText,
        tabName: sidebarTab.tabName,
        draft: sidebarTab.draft,
        holiday: sidebarTab.holiday,
        artistName: sidebarTab.artistName,
        uri: sidebarTab.uri,
        songName: sidebarTab.songName,
        createdTime: sidebarTab.createdTime,
        starred: sidebarTab.starred,
        tuning: sidebarTab.tuning,
        capo: sidebarTab.capo,
      })
    }).then(r => r.json())
    console.log('saveResponse:', saveResponse)
    if (saveResponse.ok == 1) {
      setTabs(
        tabs.map(t => {
          if (t.id == sidebarTab.id) {
            t['tabText'] = sidebarTab.tabText
            t['_id'] = saveResponse.value?._id ?? saveResponse.lastErrorObject.upserted
          }
          return t
        })
      )
    }
  }

  async function exportTab() {
    console.log(tabs)
    let sidebarTab = tabs.find(t => t['id'] == tabId)
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
      if (t['id'] == tabId) {
        t['googleDocsId'] = saveResponse['googleDocsId']
      }
      return t
    })
    // console.log(tabs)
    saveTab()

    setTabs(tabs)
  }
  
  function formatTab() {
    setTab({
      ...tab,
      tabText: formatRawTabs(tab.tabText),
    })

  }

  let setTabText = (event) => {
    console.log({
      ...tab,
      tabText: event.target.value
    })
    setTab({
      ...tab,
      tabText: event.target.value,
    })
  }

  return (
    <div className={styles['container']}>
      
      {/*<div style={{display: 'flex', width: '100%', height: '100%',}}>
      </div>
      */} 
      <div style={{display: 'flex', backgroundColor: 'black', width: '100%'}}>
        <MenuBar
          items={{
            'file': [{ title: 'save tab', onClick: saveTab, }],
            'import': [{ title: 'import tab from Google Docs', onClick: importTab, }],
            'export': [{ 
              title: 'export tab to Google Docs', 
              onClick: exportTab, 
              disabled: false 
            },{
              title: 'open tab in Google Docs',
              onClick: () => {},
              disabled: false,
            }],
            'format': [{ title: 'format tab text', onClick: formatTab, }],
          }}
          styles={menuBarStyles}
        />
        <StyleEditor 
          fontSize={fontSize} 
          setFontSize={setFontSize}
        />
        <TitleBar
          tab={tab}
        />
        <DetailBar
          tab={tab}
        />
      </div>
      {/*<TabEditBar 
        tabId={tabId}
        tabText={tabText}
        setTabText={setTabText}
        userId={userId}
        tabs={tabs}
        setTabs={setTabs}/>*/}
      <TabTextArea 
        tabText={tab?.tabText ?? ''}
        setTabText={setTabText}
        fontSize={fontSize}
      />
    </div>
  )
}