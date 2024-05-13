import { useState, useEffect, useContext } from 'react'
import { MenuBar, Dropdown } from 'quantifyjs'

import FullscreenWindow from '../components/FullscreenWindow.js'

export default function EditTabWindow({ 
  show=false,
  tabs, 
  setTabs, 
  tabId, 
  editTab,
  setEditTab, 
  saveTab,
}) {
  function fixTab(tab) {
    if (!tab) return

    if (!tab?.capo) {
      tab['capo'] = 0
    }
    if (!tab?.tuning) {
      tab['tuning'] = 'EADGBe'
    }
    if (tab && !('draft' in tab )) {
      tab['draft'] = true
    }

    return tab
  }

  const [tab, setTab] = useState( tabs.length > 0 ? fixTab(tabs.find(t => t.id == tabId) ) : null)
  
  useEffect(() => {
    let t = tabs.find(t => t.id == tabId)
    if (!t) return;

    setTab(fixTab(t))
  }, [tabs, tabId])

  if (!tabId) return null;


  // useEffect(() => {
  //   if (tabs.map(p => p.id).includes(tabId)) {
  //     // console.log('replacing', )
  //     setTabs(tabs.map(t => t.id == tabId ? tab : t))
  //   }
  //   else {
  //     console.log('appending')

  //     setTabs([...tabs, tab])
  //   }
  // }, [tab])


  function setArtistName(event) {
    event.preventDefault()
    setTab({
      ...tab,
      artistName: event.target.value
    })
  }

  function setSongName(event) {
    event.preventDefault()
    setTab({
      ...tab,
      songName: event.target.value
    })
  }

  function setCapo(event) {
    event.preventDefault()
    let value = event.target.value
    if (!(parseInt(value) >= 0)) {
      value = null
    }
    else {
      value = parseInt(value)
    }
    setTab({
      ...tab,
      capo: value
    })
  }

  function setBpm(event) {
    event.preventDefault()
    setTab({
      ...tab,
      bpm: event.target.value
    })
  }

  function setTuning(val) {
    // event.preventDefault()
    setTab({
      ...tab,
      tuning: val
    })
  }

  function setDraft(val) {
    // event.preventDefault()
    setTab({
      ...tab,
      draft: !!val
    })
  }



  async function save(event) {
    event.preventDefault()


    // console.log({
    //   tabs,
    //   tabId,
    //   t: tbs.map(t => t.id).includes(tabId),
    // })

    if (tabs.map(p => p.id).includes(tabId)) {
      console.log('replacing', tab)
      setTabs(tabs.map(t => t.id == tabId ? tab : t))
    }
    else {
      console.log('appending', tab)

      setTabs([...tabs, tab])
    }
    saveTab()
    console.log('saved ', tab)
    close(event)
  }

  function close(event) {
    event.preventDefault()
    setEditTab(null)
  }

  return (<FullscreenWindow
    show={show}
    action={save}
    close={close}
    actionLabel='save'
    content={
      <div>
        { 
          tab != null ? Object.entries(tab).map(entry => {
            let key = entry[0]
            let value = entry[1]

            if (!['artistName', 'songName', 'bpm', 'capo', 'tuning', 'draft'].includes(key)) {
              return
            }

            let onChangeFunctions = {
              artistName: setArtistName,
              songName: setSongName,
              bpm: setBpm,
              capo: setCapo,
              tuning: setTuning,
              draft: setDraft,
            }

            return <InfoRow 
              key={key} 
              label={key} 
              value={value} 
              onChange={onChangeFunctions[key]}
              items={
                key=='tuning' ? ['EADGBe', 'DADGBe', 'D#G#C#F#A#D#'] :
                key=='draft' ? [true, false] : 
                undefined
              }
            />
          }) : null
        }
      </div>
    }
  />)
}

function InfoRow({
  label, value, items, disabled=false, onChange=() => {},
}) {
  return (<div style={{display: 'flex'}}>
    <label style={{flex: 1}} htmlFor={label}>{label}</label>
    {items!=undefined ? 
      <Dropdown items={items} selected={value} onDropdownChange={onChange}/> : 
      <input style={{flex: 1}} type="text" name={label} value={value} disabled={disabled} onChange={onChange}/>}
  </div>)
}

