import React from 'react'
import Header from './Header'
import styles from '../styles/Layout.module.css'
// import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.content}>{children}</main>
    </div>
  )
}