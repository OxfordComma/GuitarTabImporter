'use client'
import styles from 'styles/Footer.module.css'
import { useState, useEffect, useContext } from 'react'
import { TabsContext } from 'components/Context'


export default function Footer ({ 
  
}) {
  let {
    footerMessage
  } = useContext(TabsContext)

	return (
    <div className={styles['footer']}>
      <div style={{marginLeft: 'auto'}}>{footerMessage}</div>  
    </div>	
	)
}