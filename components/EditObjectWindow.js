import { useState, useEffect, useContext } from 'react'
import { MenuBar, Dropdown } from 'quantifyjs'

import FullscreenWindow from '../components/FullscreenWindow.js'

export default function EditObjectWindow({ 
  // tabs, 
  // setTabs, 
  // tabId, 
  // editTab,
  // setEditTab, 
  // saveTab,
  editObject = {},
  setEditObject = () => {},
  subset,
  show=false,
  save = (obj) => console.log('default save obj', obj)
}) {
  // function save(event) {
  //   event.preventDefault()
  //   // setTab({
  //   //   ...tab,
  //   //   songName: event.target.value
  //   // })
  // }

  function close(event) {
    event.preventDefault()
    setEditObject(undefined)
  }

  function onChangeRow(event) { }
  
  return (<FullscreenWindow
    show={show}
    action={() => {
      // console.log(editObject) 
      save(editObject)
      close(event)
    } }
    close={close}
    // actionLabel='save'
    content={
      <div>{
        (subset ? subset : Object.keys(editObject)).map(key => {
            // let key = entry[0]
            let value = editObject[key]

           return (<InfoRow 
              key={key} 
              label={key} 
              value={value} 
              onChange={e => setEditObject({
                ...editObject,
                [e.target.id]: e.target.value
              })}
              // items={
              //   key=='tuning' ? ['EADGBe', 'DADGBe', 'D#G#C#F#A#D#'] :
              //   key=='draft' ? [true, false] : 
              //   undefined
              // }
              />)
         })
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
      <input id={label} style={{flex: 1}} type="text" name={label} value={value} disabled={disabled} onChange={onChange}/>}
  </div>)
}