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
  keyFunction=d => d._id,
  labelFunction = d => d.name
}) {
  // let [selectedObject, setSelectedObject] = useState(undefined)
  // console.log('pick object', {
  //   openObjects
  // })
  
  const [selectedObjectId, setSelectedObjectId] = useState(openObjects ? openObjects[0]?._id : undefined)

  useEffect(() => {
    const keyDownHandler = (e) => {
      console.log(`You pressed ${e.code}.`, selectedObjectId, e.code === "Enter")
      // if (e.code === "Enter") {
      //   open()
      // }

      if (e.code === "Escape") {
        close()
      }

      
    }
    document.addEventListener("keydown", keyDownHandler);

    // clean up
    return () => {
      document.removeEventListener("keydown", keyDownHandler);
    };

  }, [])

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
    // console.log(event.target); 
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
            key={keyFunction(object)} 
            id={keyFunction(object)} 
            selected={keyFunction(object) === selectedObjectId} 
            value={keyFunction(object)}
            onClick={onClick}>
            {labelFunction(object)}
          </option>)
      })}
    </select>}
  />
}