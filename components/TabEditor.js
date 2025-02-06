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
  // userId,
  mode='edit',
  showSidebar,
  setShowSidebar,
  keyFunction=d => d._id,
  // setCreateNewSidebarItem,
  // setEditTab,
  // importTab,
  // exportTab,
  columns=1,
}) {
  const [fontSize, setFontSize] = useState(9)

  const [tab, setTab] = useState(tabs.find(t => keyFunction(t) == tabId))
  const [tabText, setTabText] = useState('')
  const fontScale = 1.5 // So size works better w/ google docs

  // console.log('TabEditor', {
  //   tabs, setTabs
  // })

  useEffect(() => {
    let newTab = tabs.find(t => keyFunction(t) === tabId)
    // console.log('newTab', newTab, tabId, tabs)
    setTabText(newTab?.tabText ?? '');
    setTab(newTab)
  }, [tabId, tabs])

  // useEffect(() => {
  //   if (mode=='view') return; 
    
  //   let newTabs = tabs.map(t => {
  //     if (t['_id'] === tabId && tab) {
  //       // try {
  //         t['tabText'] = tab['tabText'] ?? ''
  //       // }
  //       // catch(e) {
  //         // console.log('error', e)
  //       // }
  //     }
  //     return t
  //   })

  //   setTabs(tabs)

  // }, [tab.tabText])

  // let setTabText = (event) => {
  //   event.preventDefault();
  //   // console.log({
  //   //   ...tab,
  //   //   tabText: event.target.value
  //   // })
  //   // setTab({
  //   //   ...tab,
  //   //   tabText: event.target.value,
  //   // })
  //   setTabText(event.target.value)
  // }

  useEffect(() => {
    if (!tabId) return;
    // console.log('set tabs', tabs, tabId, tabText)
    setTabs(tabs.map(t => keyFunction(t) === tabId ? { ...t, tabText: tabText } : t))
  }, [tabText])

  // function openTabInDocs() {
  //   if (tab.googleDocsId)
  //     window.open(`https://docs.google.com/document/d/${tab.googleDocsId}`)
  // }

  
  
  // function formatTab() {
  //   setTab({
  //     ...tab,
  //     tabText: formatRawTabs(tab.tabText),
  //   })
  // }

  

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

  // let toggleTwoColumns = () => {
  //   console.log('toggling columns', columns)
  //   setColumns(columns === 2 ? 1 : 2)
  // }


  let lineDelim = /\r|\r\n|\n/
  let numLines = tab?.tabText.split(lineDelim).length;
  let halfLines = parseInt(numLines/2);
  
  // console.log({
  //   tabs, tab, numLines
  // })


  return (
    <div className={styles['container']}>
      <div style={{display: 'flex', backgroundColor: 'black', width: '100%',alignItems: 'center'}}>
        <TitleBar
          tab={tabs.find(t => keyFunction(t) == tabId)}
        />
        <DetailBar
          tab={tabs.find(t => keyFunction(t) == tabId)}
          fontSize={fontSize}
          setFontSize={setFontSize}
        />
      </div>
      <div className={styles['text-area-container']}>
        {
          columns > 1 ? 
            [
              <TabTextArea 
                key='left'
                tabText={
                  tabText ?  
                    tabText.split(lineDelim).slice(
                      0, halfLines
                    ).join('\n') :
                    ''
                }  
                setTabText={setTabText}
                fontSize={fontSize * fontScale}
                readOnly={true}
              />,
              <TabTextArea 
                key='right'
                tabText={
                  tabText ?  
                    tabText.split(lineDelim).slice(
                      halfLines
                    ).join('\n') :
                    ''
                }  
                setTabText={setTabText}
                fontSize={fontSize * fontScale}
                readOnly={true}
              />
            ] :
            <TabTextArea 
              tabText={tabText}
              setTabText={setTabText}
              fontSize={fontSize * fontScale}
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
      onChange={e => { e.preventDefault(); setTabText(e.target.value) }}
      style={{ fontSize: fontSize }}
    />)
}

function StyleEditor({
  tab,
  fontSize,
  setFontSize,
}) {
  let styleEditorStyles = {
    display:'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    // marginRight: '10px'
  }
  
  let buttonStyle = {
    display: 'flex', 
    width: '15px',
    height: '15px', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: '2.5px',
  }
  return ( tab ? 
    <div style={styleEditorStyles}>
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

function DetailBar({ tab, fontSize, setFontSize }) {
  let tabTuning = tab?.tuning
  let tabCapo = tab?.capo
  let tabBpm = tab?.bpm

  let showTuning = tabTuning && tabTuning != 'EADGBe'
  let showCapo = parseInt(tabCapo) > 0
  let showBpm = parseInt(tabBpm) > 0
  
  function Tuning({tuning, show}) {
    let tuningStyle = {
      color: show ? 'white' : 'gray'
    }
    return (<div style={tuningStyle}>
      {tuning ? tuning : 'no tuning'}
    </div>)
  }

  function Capo({capo, show}) {
    let capoStyle = {
      color: show ? 'white' : 'gray'
    }
    return (<div style={capoStyle}>
      {capo ? `capo ${capo}` : 'no capo'}
    </div>)
  }

  function Bpm({bpm, show}) {
    let capoStyle = {
      color: show ? 'white' : 'gray'
    }
    return (<div style={capoStyle}>
      {bpm ? `${bpm} BPM` : ''}
    </div>)
  }

  function Separator({left, right}) {
    let sepStyle = {
      color: left ? 'white' : 'gray',
      marginLeft: 5,
      marginRight: 5,
    }
    return (<div style={sepStyle}>
      {''}
    </div>)
  }


  let detailStyles = {
    display: 'flex', 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'pre-wrap', 
    fontSize: '1.1em'
  }

  return (tab ? <div style={detailStyles}>
    {<StyleEditor 
      tab={tab}
      fontSize={fontSize} 
      setFontSize={setFontSize}
    />}
    {<Separator left={true} right={showTuning}/>}
    {<Tuning tuning={tabTuning} show={showTuning}/>}
    {<Separator left={showTuning} right={showCapo}/>}
    {<Capo capo={tabCapo} show={showCapo}/>}
    {<Separator left={showBpm} right={showBpm}/>}
    {<Bpm bpm={tabBpm} show={showBpm}/>}
    
  </div> : null)

  // return (tab ? <span style={ } >
  //     {bpm(tabBpm, showBpm)}
  //     {showBpm ? separator(showBpm, showTuning) : ''}
  //     {tuning(tabTuning, showTuning)}
  //     {separator(showBpm, showTuning)}
  //     {' '}
  //     {capo(tabCapo, showCapo)}
  //   </span> : <div></div>
  // )
}
