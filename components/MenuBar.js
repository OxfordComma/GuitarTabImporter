// import styles from '../styles/MenuBar.module.css'
// import Link from 'next/link'
import { useState, useEffect } from 'react'


function MenuBarItem({ 
  title, 
  menuItems,
  justify,
  show,
  setShow,
  styles={}
}) {
  // console.log('show me?', show)
  let updateShow = (showMe) => setShow(s => { let obj = Object.assign({}, s); obj[title] = showMe; return obj })

  const dropdownStyles = {
    position: 'fixed',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10,
  }

  const backgroundStyles = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: '0%',
    top: 0,
    left: 0,
    zIndex: 5,
    backgroundColor: 'black',
    pointerEvents: 'none',
  }

  const menuBarItemStyles = {
    marginLeft: justify == 'right' ? 'auto' : '0px',
    zIndex: 10,
    paddingLeft: '5px',
    paddingRight: '5px',
  }

  const onMouseOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('onMouseOver')
    if (Object.values(show).some(i => i)) {
      updateShow(true)
    }
  }

  const onMouseOut = (e) => {
    console.log('onMouseOut')
    e.preventDefault();
    setTimeout(updateShow(false), 1000)
    // updateShow(false)
  }
  return (
    <div className={styles['menu-bar-item']} style={menuBarItemStyles} onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
      <div 
        href=''
        legacyBehavior={false} 
        onClick={(e) => {
          e.preventDefault(); 
          e.stopPropagation();
          console.log('{'+title+'} item clicked')
          show[title] ? updateShow(false) : updateShow(true)
        }}
        >
          {title}
      </div>
      <div className={styles['menu-bar-dropdown']} style={dropdownStyles}>
      { show[title] ? menuItems?.map(menuItem => {
          let func = () => {}
          if (menuItem.onClick)
            func = menuItem.onClick

          let disabled = false
          if (menuItem.disabled)
            disabled = true

          return (
            <div 
              key={menuItem.title}
              className={styles['menu-bar-dropdown-item']}
              style={disabled ? {'opacity': '0.6'} : null}
              href=''
              legacyBehavior={false} 
              onClick={(e) => {
                event.preventDefault(); 
                console.log(`${menuItem.title} clicked`)
                if (!disabled)
                  func()
                  updateShow(false)
              }}
            >
              {menuItem.title}
          </div>)
        }) : null
      }
      </div>
      {show[title] ? <div 
        className={styles['background']} style={backgroundStyles}
        onClick={(e) => {console.log('background clicked'); updateShow(false)}}>
          {}
        </div> : null
      }
    </div>
  )
}

export default function MenuBar({ 
  menuItems, 
  styles={}
}) {
  let [show, setShow] = useState(Object.keys(menuItems).reduce((acc, curr) => {
    acc[curr] = false
    return acc
  }, {}))

  const basicStyles = {
    display: 'flex', 
    flex: '0 0 0',
    flexDirection: 'row',
  }
  return (
    <div className={styles['menu-bar']} style={basicStyles}>
      {Object.keys(menuItems).map(key => {
        let menu = menuItems[key]
        if (menu instanceof Array) {
          return (
              <MenuBarItem
                key={key}
                title={key}
                menuItems={menu}
                styles={styles}
                show={show}
                setShow={setShow}
              /> 
          )
        }
        else {
          return (
            <MenuBarItem
              key={key}
              title={key}
              onClick={menu['onClick']}
              justify={menu['justify']}
              styles={styles}
              show={show}
              setShow={setShow}  
            />
          )
        }
      })}
    </div>
  )
}