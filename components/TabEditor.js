import styles from '../styles/TabEditor.module.css'
import Link from 'next/link'
import React from 'react'
import { useState, useEffect } from 'react'

import { MenuBar } from 'quantifyjs'
import menuBarStyles from '../styles/MenuBar.module.css'
import { formatRawTabs } from '../lib/tabhelper.js'

function useDebounce(cb, delay) {
  const [debounceValue, setDebounceValue] = useState(cb);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceValue(cb);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [cb, delay]);
  return debounceValue;
}

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
  let lineDelim = /\r|\r\n|\n/
  const tab = tabs.find(t => keyFunction(t) === tabId)
  const [fontSize, setFontSize] = useState(tab?.fontSize ?? 9)
  const [tabText, setTabText] = useState(tab?.tabText)
  const fontScale = 1.5 // So size works better w/ google docs
  const [leftColumnText, setLeftColumnText] = useState('')
  const [rightColumnText, setRightColumnText] = useState('')
  // const [debounceVal, setDebounceVal] = useState("");
  const debounceValue = useDebounce(tabText, 2000);

  useEffect(() => {
    let numLines = tabText?.split(lineDelim).length;
    let colSplit = leftColumnText.split(lineDelim).length
    // let colSplit = (tab && 'columnSplit' in tab) ? parseInt(tab['columnSplit']) : parseInt(numLines/2)
    setTabs(tabs.map(t => keyFunction(t) === tabId ? { 
      ...t, 
      tabText: tabText,
      fontSize: fontSize,
      columnSplit: colSplit,
    } : t))
    console.log("tab text set:", { tabText, fontSize, colSplit });

  }, [debounceValue]);

  useEffect(() => {
    let newTab = tabs.find(t => keyFunction(t) === tabId)
    console.log('newTab', newTab, columns)
    let numLines = newTab?.tabText?.split(lineDelim).length;
    let halfLines = parseInt(numLines/2);
    let colSplit = (newTab && 'columnSplit' in newTab) ? parseInt(newTab['columnSplit']) : parseInt(numLines/2)

    // console.log('newTab', newTab, tabId, tabs)
    // setTabText(newTab?.tabText ?? '');
    setFontSize(newTab?.fontSize ?? 9);
    // setColumns(newTab?.columns ?? 1)

    setLeftColumnText(
      newTab?.tabText ? newTab.tabText.split(lineDelim).slice(
          0, columns === 2 ? colSplit : numLines
        ).join('\n') :
        ''
    )

    setRightColumnText(
      newTab?.tabText ? newTab.tabText.split(lineDelim).slice(
          columns === 2 ? colSplit : numLines
        ).join('\n') :
        ''
    )
  }, [tabs, tabId, columns])

  useEffect(() => {
    if (!tabId) return;
    setTabs(tabs.map(t => keyFunction(t) === tabId ? { 
      ...t, 
      fontSize: fontSize,
    } : t))
  }, [fontSize])

  useEffect(() => {
    if (columns === 2 ) {
      setTabText(`${leftColumnText}\n${rightColumnText}`)
    }
    else {
      setTabText(`${leftColumnText}`)
    }
  }, [columns, leftColumnText, rightColumnText])


  // let numLines = tab?.tabText.split(lineDelim).length;
  // let halfLines = parseInt(numLines/2);
  // let colSplit = (tab && 'columnSplit' in tab) ? parseInt(tab['columnSplit']) : parseInt(numLines/2)

  
  
  return (
    <div className={styles['container']}>
      <div style={{display: 'flex', backgroundColor: 'black', width: '100%',alignItems: 'center'}}>
        <TitleBar
          tab={tabs.find(t => keyFunction(t) == tabId)}
          tabText={tabText}
          fontSize={fontSize}
          columns={columns}
        />
        <DetailBar
          tab={tabs.find(t => keyFunction(t) == tabId)}
          fontSize={fontSize}
          setFontSize={setFontSize}
        />
      </div>
      <div className={styles['text-area-container']}>
        {
          columns === 2 ? 
            [
              <TabTextArea 
                key='left'
                tabText={
                  leftColumnText
                }  
                setTabText={setLeftColumnText}
                fontSize={fontSize * fontScale}
                readOnly={false}
              />,
              <TabTextArea 
                key='right'
                tabText={
                  rightColumnText
                }  
                setTabText={setRightColumnText}
                fontSize={fontSize * fontScale}
                readOnly={false}
              />
            ] :
            <TabTextArea 
              tabText={leftColumnText}
              setTabText={setLeftColumnText}
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
      <button style={buttonStyle} onClick={() => setFontSize(fontSize+0.5)}>+</button>
      <button style={buttonStyle} onClick={() => setFontSize(fontSize-0.5)}>−</button>
      <div style={buttonStyle}>{fontSize}</div>
    </div> : <div></div>
  )
}

function TitleBar({ tab, tabText, fontSize, columns }) {
  let lineDelim = /\r|\r\n|\n/
  let numLines = tabText?.split(lineDelim).length;
  function Warning({ show }) {
    return (<div>
      {show ? <div title='Document may exceed length requirements.'>⚠️</div> : null}
    </div>)
  }
  let showWarning = (78 - ((fontSize - 8) * 8 )) < (numLines / columns)
  // console.log('show warning', showWarning, numLines, columns, fontSize, (78 - ((fontSize - 8) * 7 )), (numLines / columns))

  return (
    <div className={styles['title-bar']}>
      {tab && tab?.artistName ? `${tab?.artistName.replace(/ /g, '').toLowerCase()}_${tab.songName.replace(/ /g, '').toLowerCase()}.tab` : ''}
      {<Warning show={showWarning}/>}
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
}
