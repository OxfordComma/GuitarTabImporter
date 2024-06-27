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
  exportTab,
}) {
  const [fontSize, setFontSize] = useState(12)
  const [columns, setColumns] = useState(1)

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
    setShowSidebar(!showSidebar)
  }

  let toggleTwoColumns = () => {
    console.log('toggling columns', columns)
    setColumns(columns === 2 ? 1 : 2)
  }


  let lineDelim = /\r|\r\n|\n/
  let numLines = tab?.tabText.split(lineDelim).length;


  return (
    <div className={styles['container']}>
      <div style={{display: 'flex', backgroundColor: 'black', width: '100%',alignItems: 'center'}}>
        <MenuBar
          items={
            {
              'sidebar': [
                { 
                  title: 'show sidebar', 
                  onClick: (e) => {e.preventDefault(); setShowSidebar(!showSidebar)},
                  disabled: mode!='view',
                }
              ],
              'format': [
                { 
                  title: 'format tab text', 
                  onClick: formatTab,
                  disabled: mode=='view',
                }, {
                  title: 'add tab staff',
                  onClick: addTabStaff,
                  disabled: mode=='view',
                }, {
                  title: 'two column mode',
                  onClick: toggleTwoColumns,
                }
              ],
              'export': [
                { 
                  title: 'export tab to Google Docs', 
                  onClick: exportTab, 
                  disabled: mode=='view',
                  visible: mode=='view',
                },{
                  title: 'open tab in Google Docs',
                  onClick: openTabInDocs,
                  disabled: tab?.['googleDocsId'] == null,
                }
              ],
              'import': [
                { 
                  title: 'import tab from Google Docs', 
                  onClick: importTab,
                  disabled: (mode=='view' || tab?.['googleDocsId'] == null),
                }
              ],
            }
          }
          styles={menuBarStyles}
        />
        <TitleBar
          tab={tab}
        />
        <StyleEditor 
          tab={tab}
          fontSize={fontSize} 
          setFontSize={setFontSize}
        />
        <DetailBar
          tab={tab}
        />
      </div>
      <div className={styles['text-area-container']}>
        {
          columns > 1 ? 
            [
              <TabTextArea 
                key='left'
                tabText={
                  tab?.tabText ?  
                    tab.tabText.split(lineDelim).slice(
                      0, parseInt(numLines/2)
                    ).join('\n') :
                    ''
                }  
                setTabText={setTabText}
                fontSize={fontSize}
                readOnly={true}
              />,
              <TabTextArea 
                key='right'
                tabText={
                  tab?.tabText ?  
                    tab.tabText.split(lineDelim).slice(
                      parseInt(numLines/2)
                    ).join('\n') :
                    ''
                }  
                setTabText={setTabText}
                fontSize={fontSize}
                readOnly={true}
              />
            ] :
            <TabTextArea 
              tabText={tab?.tabText ?? ''}
              setTabText={setTabText}
              fontSize={fontSize}
              readOnly={mode=='view'}
            />
        }
      </div>
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
  tab,
  fontSize,
  setFontSize,
}) {
  let buttonStyle = {
    display: 'flex', 
    width: '15px',
    height: '15px', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: '2.5px',
  }
  return ( tab ? 
    <div style={{display:'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px'}}>
      {/*<div>font size:</div>*/}
      <button style={buttonStyle} onClick={() => setFontSize(fontSize+1)}>+</button>
      <button style={buttonStyle} onClick={() => setFontSize(fontSize-1)}>−</button>
      <div style={buttonStyle}>{fontSize}</div>
    </div> : <div></div>
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
      {','}
    </div>)
  }

  return (tab ? <span style={{display: 'flex', flexDirection: 'row', whiteSpace: 'pre-wrap', fontSize: '1.1em'} } >
      {bpm(tabBpm, showBpm)}
      {showBpm ? separator(showBpm, showTuning) : ''}
      {tuning(tabTuning, showTuning)}
      {separator(showBpm, showTuning)}
      {' '}
      {capo(tabCapo, showCapo)}
    </span> : <div></div>
  )
}
