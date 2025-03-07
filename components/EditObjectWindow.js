'use client'
import { useState, useEffect, useContext } from 'react'
import { MenuBar, Dropdown } from 'quantifyjs'

import FullscreenWindow from '../components/FullscreenWindow.js'

export default function EditObjectWindow({ 
  editObject = {},
  setEditObject = () => {},
  subset,
  omit=[],
  show=false,
  save = (obj) => console.log('default save obj', obj),
  close = () => console.log('default close obj'),
  options,
}) {
  
  return (<FullscreenWindow
    show={show}
    action={() => {
      // console.log(editObject) 
      save(editObject)
      close()
    } }
    close={close}
    // actionLabel='save'
    content={
      <div>{
        (subset ? subset : Object.keys(editObject).filter(k => !omit.includes(k))).map(key => {
            // let key = entry[0]
            let value = editObject[key]
            let items = undefined
            let onChange = e => setEditObject({
              ...editObject,
              [e.target.id]: e.target.value
            })

            if (options && key in options) {
              items = options[key]
              onChange = val => setEditObject({
                ...editObject,
                [key]: val
              })
            }

            return (
              <InfoRow 
                key={key} 
                label={key} 
                value={value} 
                items={items}
                onChange={onChange}
              />
            )
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
    <label style={{flex: 1, color: 'var(--text-color)'}} htmlFor={label}>{label}</label>
    {items!=undefined ? 
      <Dropdown items={items} selected={value} onDropdownChange={onChange}/> : 
      <input id={label} style={{flex: 1, backgroundColor: 'var(--bg-color)', border: '1px solid var(--text-color)'}} type="text" name={label} value={value} disabled={disabled} onChange={onChange}/>}
  </div>)
}