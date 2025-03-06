import styles from 'styles/OptionList.module.css'

import React, { useState, useEffect } from 'react'
import useDebounce from 'lib/debounce'

export default function OptionList({ 
    options,
    onSelect,
	onClick=() => {},
    keyFunction = d => d['Id'],
    labelFunction = d => d['Name'],
}) {
	
    const [selectedId, setSelectedId] = useState()
    const [searchString, setSearchString] = useState('')

	const debounceValue = useDebounce(searchString, 1.0 * 1000);
	

	useEffect(() => {
		const keyDownHandler = (e) => {
			let currentlySelectedIndex = options.findIndex(r => keyFunction(r) === selectedId)
			let newSelectedId
			if (e.code === "ArrowDown") {
				e.preventDefault();
				let newSelectedIndex = (currentlySelectedIndex < 0) ? 0 : (currentlySelectedIndex >= (options.length - 1)) ? (options.length-1) : currentlySelectedIndex + 1 
				 newSelectedId = keyFunction(options[newSelectedIndex] )
			} 
			else if (e.code === "ArrowUp") {
				e.preventDefault();
				let currentlySelectedIndex = options.findIndex(r => keyFunction(r) === selectedId)
				let newSelectedIndex = (currentlySelectedIndex <= 0) ? 0 : (currentlySelectedIndex > (options.length - 1)) ? (options.length-1) : currentlySelectedIndex - 1 
				newSelectedId = keyFunction(options[newSelectedIndex] )
			}
			else if (e.key.match(/[A-Za-z ]/)) {
				if (e.code === "Space") e.preventDefault();

				let newSearchString = `${searchString}${e.key.toLowerCase()}`
				console.log('new search string', newSearchString.toLowerCase() )
				setSearchString(newSearchString)
				let currentlySelectedIndex = options.findIndex(r => keyFunction(r) === selectedId)
				let newSelectedIndex = options.findIndex(r => labelFunction(r).slice(0, searchString.length + 1 ).toLowerCase() === newSearchString.toLowerCase())
				// console.log('new index', newSelectedIndex )
				newSelectedId = keyFunction(options[newSelectedIndex] ?? currentlySelectedIndex )
				// console.log('new id', newSelectedId )
			}
			if (newSelectedId) {
				setSelectedId(newSelectedId)
				onSelect(options.find(opt => keyFunction(opt) === newSelectedId)  )
				document.getElementById(newSelectedId).scrollIntoView()
			}
		
		}
		document.addEventListener("keydown", keyDownHandler);
	
		return () => {
		  document.removeEventListener("keydown", keyDownHandler);
		};

	}, [selectedId, searchString])

	useEffect(() => {
		setSearchString(''); 
		console.log('search string reset') 
	}, [debounceValue])

    
    function onSelectChange(event) {
		onClick(event)
		event.preventDefault(); 
        let newId = event.target.id
		// console.log('onSelectChange', event.target, newId); 
		setSelectedId(newId)
		onSelect(options.find(opt => keyFunction(opt) === newId)  )
	}

    let selectedStyles = {
		backgroundColor: 'var(--text-color)',
		color: 'var(--bg-color)',
	}
	

	function selectedStylesFunc(object) {
		return keyFunction(object)===selectedId ? selectedStyles : {}
	}
	return <div 
		className={styles['option-list-container']}
		// size={5}
		// value={selectedId}
		// onChange={onSelectChange}
	>
		{options.map(object => (
			<div style={{ ...selectedStylesFunc(object) }} className={styles['option-list']} key={keyFunction(object)} >
				<div style={{...selectedStylesFunc(object) }} className={styles['option']} key={keyFunction(object)} id={keyFunction(object)} value={keyFunction(object)} onClick={onSelectChange} >{labelFunction(object)}</div>
			</div>)
		)}
	</div>
}