import styles from '../styles/TabEditor.module.css'
import Link from 'next/link'
import React from 'react'
import { useState, useEffect } from 'react'

import { MenuBar } from 'quantifyjs'
import menuBarStyles from '../styles/MenuBar.module.css'
import { formatRawTabs } from '../lib/tabhelper.js'

export default function Editor ({ 
  tabs, 
  setTabs,
  saveTab,
  tabId, 
  userId,
  mode='edit',
  showSidebar,
  setShowSidebar,
  importTab,
}) {
  const [fontSize, setFontSize] = useState(12)
  const [tab, setTab] = useState(tabs.find(t => t['id'] == tabId) ?? null)

  useEffect(() => {
    let newTab = tabs.find(t => t['id'] == tabId)
    setTab(newTab);

  }, [tabId, tabs])

  useEffect(() => {
    if (mode=='view') return; 
    
    let newTabs = tabs.map(t => {
      if (t['id'] == tabId && tab) {
        // try {
          t['tabText'] = tab['tabText'] ?? ''
        // }
        // catch(e) {
          // console.log('error', e)
        // }
      }
      return t
    })

    setTabs(tabs)

  }, [tab?.tabText])

  let setTabText = (event) => {
    event.preventDefault();
    console.log({
      ...tab,
      tabText: event.target.value
    })
    setTab({
      ...tab,
      tabText: event.target.value,
    })
  }

  function openTabInDocs() {
    if (tab.googleDocsId)
      window.open(`https://docs.google.com/document/d/${tab.googleDocsId}`)

  }

  async function exportTab() {
    let sidebarTab = tab
    console.log('exporting:', sidebarTab)
    let user = await fetch('api/user').then(r => r.json())
    let account = await fetch(`/api/account?userid=${userId}`).then(r => r.json())

    let exportResponse = await fetch(`api/create`, {
      method: 'POST',
      body: JSON.stringify({
        tab: tab,
        account: account,
        folder: user.folder,
      })
    }).then(r => r.json())  

    // console.log('exportResponse:', exportResponse)
    tabs = tabs.map(t => {
      if (t['id'] == tabId) {
        t['googleDocsId'] = exportResponse['googleDocsId']
      }
      return t
    })

    saveTab()

    setTabs(tabs)
  }
  
  function formatTab() {
    setTab({
      ...tab,
      tabText: formatRawTabs(tab.tabText),
    })
  }

  

  let addTabStaff = () => {
    let staffString = '\n'+
'e|----------------------------------------------------------------------------------|\n'+
'B|----------------------------------------------------------------------------------|\n'+
'G|----------------------------------------------------------------------------------|\n'+
'D|----------------------------------------------------------------------------------|\n'+
'A|----------------------------------------------------------------------------------|\n'+
'E|----------------------------------------------------------------------------------|'
    setTab({
      ...tab,
      tabText: tab.tabText + staffString
    })

  }

  let toggleSidebar = () => {
    setS
  }



  return (
    <div className={styles['container']}>
      <div style={{display: 'flex', backgroundColor: 'black', width: '100%'}}>
        <MenuBar
          items={{
            'file': [{ 
              title: 'show sidebar', 
              onClick: (e) => {e.preventDefault(); setShowSidebar(!showSidebar)},
              disabled: mode!='view',
            }],
            'import': [{ 
              title: 'import tab from Google Docs', 
              onClick: importTab,
              disabled: mode=='view',
            }],
            'export': [{ 
              title: 'export tab to Google Docs', 
              onClick: exportTab, 
              disabled: mode=='view', 
            },{
              title: 'open tab in Google Docs',
              onClick: openTabInDocs,
              disabled: false,
            }],
            'format': [{ 
              title: 'format tab text', 
              onClick: formatTab,
              disabled: mode=='view',
           },{
            title: 'add tab staff',
            onClick: addTabStaff,
            disabled: mode=='view',
           }],
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
      <TabTextArea 
        tabText={tab?.tabText ?? ''}
        setTabText={setTabText}
        fontSize={fontSize}
        readOnly={mode=='view'}
      />
    </div>
  )
}


function TabTextArea({ tabText, setTabText, fontSize, readOnly=false }) {
  return (
    <textarea 
      className={styles['text-area']}
      value={tabText}
      readOnly={readOnly}
      onChange={setTabText}
      style={{ fontSize: fontSize }}
    />)
}

function StyleEditor({
  fontSize,
  setFontSize,
}) {
  return (
    <div style={{display:'flex', width: '20px', height: '20px'}}>
      <button onClick={() => setFontSize(fontSize+1)}>+</button>
      <button onClick={() => setFontSize(fontSize-1)}>-</button>
      <div>{fontSize}</div>
    </div>
  )
}

function TitleBar({ tab }) {
  return (
    <div className={styles['title-bar']}>
      {tab && tab?.artistName ? `${tab?.artistName.replace(/ /g, '').toLowerCase()}_${tab.songName.replace(/ /g, '').toLowerCase()}.tab` : ''}
    </div>
  )
}

function DetailBar({ tab }) {
  let tabTuning = tab?.tuning
  let tabCapo = tab?.capo
  let tabBpm = tab?.bpm

  let showTuning = tabTuning && tabTuning != 'EADGBe'
  let showCapo = parseInt(tabCapo) > 0
  let showBpm = parseInt(tabBpm) > 0
  
  function tuning(tuning, showTuning) {
    let tuningStyle = {
      color: showTuning ? 'white' : 'gray'
    }
    return (<div style={tuningStyle}>
      {tuning ? tuning : 'no tuning'}
    </div>)
  }

  function capo(capo, showCapo) {
    let capoStyle = {
      color: showCapo ? 'white' : 'gray'
    }
    return (<div style={capoStyle}>
      {capo ? `capo ${capo}` : 'no capo'}
    </div>)
  }

  function bpm(bpm, showBpm) {
    let capoStyle = {
      color: showBpm ? 'white' : 'gray'
    }
    return (<div style={capoStyle}>
      {bpm ? `${bpm} BPM` : ''}
    </div>)
  }

  function separator(left, right) {
    let sepStyle = {
      color: left ? 'white' : 'gray'
    }
    return (<div style={sepStyle}>
      {', '}
    </div>)
  }

  return (tab ? <div style={{display: 'flex', flexDirection: 'row'} } >
      {bpm(tabBpm, showBpm)}
      {showBpm ? separator(showBpm, showTuning) : ''}
      {tuning(tabTuning, showTuning)}
      {separator(showBpm, showTuning)}
      {capo(tabCapo, showCapo)}
    </div> : <div></div>
  )
}
