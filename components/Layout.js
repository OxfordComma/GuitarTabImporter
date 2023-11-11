import React from 'react'
import Header from './Header'
import styles from '../styles/Layout.module.css'
import { useRouter } from 'next/router'
import { useSession, signIn, signOut } from "next-auth/react"
import { useState, useEffect } from 'react'

function ShowLogin() {
  const { data: session, status } = useSession()
  
  if (session) {
    return ([
      <p key='email' className={styles['login-email']}>{session.user.email}</p>,
      <button className={styles['login-button']} key='button' onClick={() => signOut({callbackUrl: '/login'})}>Sign out</button>
    ])
  }
  return (
      <button className={styles['login-button']} onClick={() => signIn('google', { callbackUrl: '/import' })}>
        Sign in with Google
      </button>
  )
}


export default function Layout({ children }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  let [data, setData] = useState([])

  useEffect(() => {
    if (status == 'unauthenticated') {
      router.push('/login')
    }
    if (status == 'authenticated') {
      router.push('/edit')
    }
  }, [status])

  return (
    <div className={styles['layout']}>
      <div className={styles['layout-header']}>
        <Header 
          headings={
            { 
              'Tabs': '/edit', 
              'Projects': '/projects',
              'Profile': '/profile' 
            }
          }
        />
        <ShowLogin/>
      </div>
      <main className={styles['layout-content']}>{children}</main>
    </div>
  )
}