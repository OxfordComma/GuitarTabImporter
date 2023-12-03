import { useState, useEffect, useContext } from 'react'
import { MenuBar, Dropdown } from 'quantifyjs'

import FullscreenWindow from '../components/FullscreenWindow.js'

export default function EditTabWindow({ 
  tabs, 
  setTabs, 
  tabId, 
  editTab,
  setEditTab, 
  styles,
}) {
  const show = editTab != null
  const [tab, setTab] = useState(tabs.find(t => t.id == tabId))

  function fixTab(tab) {
    if (!('capo' in tab)) {
      tab['capo'] = 0
    }
    if (!('tuning' in tab)) {
      tab['tuning'] = 'EADGBe'
    }

    return tab
  }
  

  useEffect(() => {
    let t = tabs.find(t => t.id == tabId)
    if (!t) return;

    setTab(fixTab(t))
  }, [tabs, tabId])

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



  async function save(event) {
    event.preventDefault()

    // await fetch(`/api/tab`, {
    //   method: 'POST',
    //   body: JSON.stringify(tab)
    // })

    // console.log({
    //   tabs,
    //   tabId,
    //   t: tbs.map(t => t.id).includes(tabId),
    // })

    if (tabs.map(p => p.id).includes(tabId)) {
      // console.log('replacing', )
      setTabs(tabs.map(t => t.id == tabId ? tab : t))
    }
    else {
      console.log('appending')

      setTabs([...tabs, tab])
    }

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

            if (['tabText'].includes(key)) {
              return
            }

            let onChangeFunctions = {
              artistName: setArtistName,
              songName: setSongName,
              bpm: setBpm,
              capo: setCapo,
              tuning: setTuning,
            }

            // <InfoRow key='id' label='id' value={tab?.id} disabled={true}/>
            // <InfoRow key='artistName' label='artistName' value={tab?.artistName} onChange={setArtistName} disabled={false}/>
            // <InfoRow key='songName' label='songName' value={tab?.songName} onChange={setSongName} disabled={false}/>
            // <InfoRow key='bpm' label='bpm' value={tab?.bpm} onChange={setBpm}  disabled={false}/>
            // <InfoRow key='capo' label='capo' value={tab?.capo} onChange={setCapo}  disabled={false}/>
            // <InfoRow key='tuning' label='tuning' items={['EADGBe', 'DADGBe', 'D#G#C#F#A#D#']} value={tab?.tuning} onChange={setTuning} disabled={false}/>

            return <InfoRow 
              key={key} 
              label={key} 
              value={value} 
              onChange={onChangeFunctions[key]}
              items={key=='tuning' ? ['EADGBe', 'DADGBe', 'D#G#C#F#A#D#'] : undefined}
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

