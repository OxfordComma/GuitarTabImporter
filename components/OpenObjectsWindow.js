import { useState, useEffect, useContext } from 'react'
// import { MenuBar, Dropdown } from 'quantifyjs'

import FullscreenWindow from '../components/FullscreenWindow.js'

export default function OpenObjectsWindow({ 
  openObjects,
  setOpenObjects,
  onOpenObject,
  // openObjectId,
  // setOpenObjectId, 
  // setPickObject,
  show,
  keyFunction=d=>d._id,
}) {
  // let [selectedObject, setSelectedObject] = useState(undefined)
  // console.log('pick object', {
  //   openObjects
  // })
  
  const [selectedObjectId, setSelectedObjectId] = useState(openObjects ? openObjects[0]?._id : undefined)

  if (openObjects === undefined) {
    return null
  }


  function open() {
    console.log('open', selectedObjectId)
    // setOpenObjectId(selectedObjectId)
    // setPickObject(false)
    onOpenObject(selectedObjectId)
  }

  function close() {
    console.log('close')
    // setPickObject(false)
    setOpenObjects(undefined)
  }

  function onClick(event) {
    //double click
    if (event.detail == 2) { 
      open()
    }
  }

  function onSelectChange(event) {
    event.preventDefault(); 
    console.log('onSelectChange', event.target.value); 
    setSelectedObjectId(event.target.value)
  }

  return <FullscreenWindow
    show={show}
    action={open}
    actionLabel='open'
    close={close}
    content={<select 
      size={25} 
      onChange={onSelectChange}
    >
      {openObjects.map(object => {
        return (
          <option 
            key={object._id} 
            selected={keyFunction(object)==selectedObjectId} 
            id={keyFunction(object)} 
            value={keyFunction(object)}
            onClick={onClick}>
            {object.name}
          </option>)
      })}
    </select>}
  />
}