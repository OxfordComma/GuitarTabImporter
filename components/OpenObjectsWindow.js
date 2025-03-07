import { useState, useEffect, useContext } from 'react'
// import { MenuBar, Dropdown } from 'quantifyjs'

import FullscreenWindow from 'components/FullscreenWindow'
import OptionList from 'components/OptionList'
export default function OpenObjectsWindow({ 
	openObjects,
	onOpenObject,
	show,
	close = () => {},
	keyFunction=d => d._id,
	labelFunction = d => d.name
}) {
  // console.log('oow', {
  //   show, openObjects
  // })

	const [selectedObjectId, setSelectedObjectId] = useState(openObjects ? keyFunction(openObjects[0]) : undefined)
	if (!show) return null

  // useEffect(() => {
	// 	const keyDownHandler = (e) => {  
	// 		// console.log('open objects window', e, show)
	// 		if (e.code === "Enter" && show) {
	// 			open()
	// 		} 
	// 	}
	// 	document.addEventListener("keydown", keyDownHandler);

	// 	return () => {
	// 		document.removeEventListener("keydown", keyDownHandler);
	// 	};
	// }, [selectedObjectId, show])

	if (openObjects === undefined) {
		return null
	}


	function open() {
		// console.log('open', selectedObjectId)
		onOpenObject(openObjects.find(obj => keyFunction(obj) === selectedObjectId))
	}

	function onSelect(obj) {
		// console.log('onSelectChange', obj); 
		setSelectedObjectId(keyFunction(obj))
	}
	
	function onClick(event) {
		//double click
		if (event.detail == 2) { 
		  open()
		}
	}

	return <FullscreenWindow
		show={show}
		action={open}
		actionLabel='open'
		close={close}
		content={<OptionList
			options={openObjects}
			onSelect={onSelect}
			onClick={onClick}
			keyFunction={keyFunction}
			labelFunction={labelFunction}
		/>}
	/>
}