import React from 'react'
import Header from './Header'
import { Context }  from './Context'
import styles from '../styles/Layout.module.css'
import { useRouter } from 'next/router'
import { useSession, signIn, signOut } from "next-auth/react"
import { createContext, useContext, useState, useEffect } from "react";

export const TabsContext = createContext([]);


function ShowLogin() {
  const { data: session, status } = useSession()

  return (<div className={styles['show-login']}>
    {session ? [
      <p key='email' className={styles['login-email']}>{session.user.email}</p>,
      <button className={styles['login-button']} key='button' onClick={() => signOut({callbackUrl: '/login'})}>Sign out</button>
    ] : (
      <button className={styles['login-button']} onClick={() => signIn('google', { callbackUrl: '/profile' })}>
        Sign in with Google
      </button>
    )}
  </div>)
  
  // if (session) {
  //   return ([
  //     <p key='email' className={styles['login-email']}>{session.user.email}</p>,
  //     <button className={styles['login-button']} key='button' onClick={() => signOut({callbackUrl: '/login'})}>Sign out</button>
  //   ])
  // }
  // return (
  //     <button className={styles['login-button']} onClick={() => signIn('google', { callbackUrl: '/import' })}>
  //       Sign in with Google
  //     </button>
  // )
}


export default function Layout({ children }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  let [data, setData] = useState([])
  let [tabs, setTabs] = useState([])

  function selectTab(tab, idx) {
    console.log(
      'selectTab', idx, tab
    )
  }

  useEffect(() => {
    console.log('auth status:', status)
    if (status == 'unauthenticated') {
      router.push('/login')
    }
    // if (status == 'authenticated') {
    //   router.push('/profile')
    // }
  }, [status])

  return (
    <div className={styles['html']}>
      <div className={styles['layout']}>
        <div className={styles['layout-header']}>
          {
            status=='unauthenticated' ? 
              <Header 
                headings={{
                  'TABR': '/login'
                }}
              /> : 
              <Header 
                headings={
                  { 
                    'Library': '/edit', 
                    'Projects': '/projects',
                    'Profile': '/profile' 
                  }
                }
              />
          }
          <ShowLogin/>
        </div>
        <main className={styles['layout-content']}>
          <Context>
            {children}
          </Context>
        </main>
      </div>
    </div>
  )
}

