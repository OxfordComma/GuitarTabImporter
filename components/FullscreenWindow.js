import styles from '../styles/FullscreenWindow.module.css'
import { useState, useEffect, useContext } from 'react'

export default function FullscreenWindow({ 
    show, 
    content, 
    action=()=>{}, 
    actionLabel='save',
    close=()=>{}
  }) {
    useEffect(() => {
      const keyDownHandler = (e) => {  
        if (e.code === "Escape") {
          close(e)
        } 
      }
      document.addEventListener("keydown", keyDownHandler);
  
      return () => {
        document.removeEventListener("keydown", keyDownHandler);
      };
    }, [])
    
  return (show ? <div className={styles['fullscreen-background']}>
    <div className={styles['fullscreen-window']}>
      
      {content}
      
      <div style={{display: 'flex', justifyContent: 'right', height: '25px', 'marginTop': 'auto'}}>
        <label htmlFor='action'></label>
        <button name='action' onClick={action}>{actionLabel}</button>

        <label htmlFor='action'></label>
        <button name='close' onClick={close}>close</button>
       </div>
    </div>
  </div> : null)
}