import styles from '../styles/MenuBar.module.css'
import Link from 'next/link'
import { useState, useEffect } from 'react'


function MenuBarItem({ 
  title, 
  menuItems,
  justify,
}) {
  let [show, setShow] = useState(false)

  return (
    <div className={styles['menu-bar-item']} style={{'marginLeft': justify == 'right' ? 'auto' : '0px'}}>
      <Link 
        href=''
        legacyBehavior={false} 
        onClick={(e) => {
          event.preventDefault(); 
          console.log('{'+title+'} item clicked')
          show ? setShow(false) : setShow(true)
        }}>
          {title}
      </Link>
      <div className={styles['menu-bar-dropdown']}>
      { show ? menuItems?.map(menuItem => {
          let func = () => {}
          if (menuItem.onClick)
            func = menuItem.onClick

          let disabled = false
          if (menuItem.disabled)
            disabled = true
          return (
            <Link 
              key={menuItem.title}
              className={styles['menu-bar-dropdown-item']}
              style={disabled ? {'opacity': '0.6'} : null}
              href=''
              legacyBehavior={false} 
              onClick={(e) => {
                event.preventDefault(); 
                console.log(`${menuItem.title} menu item clicked`)
                if (!disabled)
                  func()
                  setShow(false)                
              }}
            >
              {menuItem.title}
          </Link>)
        }) : null
      }
      </div>
      {show ? <div 
        className={styles['background']} 
        onClick={(e) => {console.log('background clicked'); setShow(false)}}>
          {}
        </div> : null
      }
    </div>
  )
}

export default function MenuBar({ 
  menuItems, 
}) {
  return (
    <div className={styles['menu-bar']}>
      {Object.keys(menuItems).map(key => {
        let menu = menuItems[key]
        if (menu instanceof Array) {
          return (
              <MenuBarItem
                key={key}
                title={key}
                menuItems={menu}
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
            />
          )
        }
      })}
    </div>
  )
}