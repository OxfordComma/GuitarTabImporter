import { useState, useEffect, useContext } from 'react'
import { MenuBar, Dropdown } from 'quantifyjs'

import FullscreenWindow from '../components/FullscreenWindow.js'

export default function EditObjectWindow({ 
  editObject,
  setEditObject,
  onOpenObject,
  accessors={},
  subset,
  show=false,
  save = (obj) => console.log('default save obj', obj)
}) {

  if (editObject === undefined) {
    return null
  }

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
      onOpenObject()
      close(event)
    } }
    close={close}
    content={
      <div>{
        (subset ? subset : Object.keys(editObject)).map(key => {
            // let key = entry[0]
            console.log('key', key, accessors)
            let accessor = accessors[key] ?? (d => d)
            console.log('accessor', accessors, accessor)
            let value = editObject[key]
            console.log('value', value)

            return (<InfoRow 
              key={key} 
              label={key} 
              value={value}
              items={[true, false, 'true', 'false'].includes(value) ? [true, false] : undefined}
              onChange={e => setEditObject({
                ...editObject,
                [key]: accessor(e.target.value)
              })}
              onDropdownChange={e => setEditObject({
                ...editObject,
                [key]: accessor(e)
              })}
              />)
         })
      }
      </div>
    }
  />)
}

function InfoRow({
  label, value, items, disabled=false, onChange=() => {}, onDropdownChange=() => {},
}) {
  return (
    <div style={{display: 'flex'}}>
      <label style={{flex: 1}} htmlFor={label}>{label}</label>
        {items !== undefined ? 
          <Dropdown items={items} selected={value} onDropdownChange={onDropdownChange}/> : 
          <input id={label} style={{flex: 1}} type="text" name={label} value={value} disabled={disabled} onChange={onChange}/>
        }
    </div>
  )
}