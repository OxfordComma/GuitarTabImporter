import React from 'react'
import Header from './Header'
import styles from '../styles/Layout.module.css'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession, signIn, signOut } from "next-auth/react"
// import Sidebar from './Sidebar'

// {status == 'authenticated' ?  [
//         <Link href='/import'>Import</Link>,
//         <Link href='/tabs'>Tabs</Link>,
//         <Link href='/edit'>Edit</Link>,
//         <Link href='/profile'>Profile</Link>
//       ] :
//       <div></div>}
//       <div className={styles.login}>
//         <ShowLogin className={styles.headeritem}/>
//       </div>

function ShowLogin() {
  const { data: session, status } = useSession()
  
  if (session) {
    return ([

      <p key='email' style={{'paddingRight':'5px'}}>{session.user.email}</p>,
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

  useEffect(() => {
    if (status == 'unauthenticated') {
      router.push('/login')
    }
    if (status == 'authenticated') {
      router.push('/edit')
    }
  }, [session, status])

  return (
    <div className={styles['layout']}>
      <div className={styles['header']}>
        <Header 
          headings={
            { 
              // 'Import': '/import', 
              'Tabs': '/edit', 
              // 'Edit': '/edit', 
              'Profile': '/profile' 
            }
          }
        />
        <ShowLogin/>
      </div>
      <main className={styles.content}>{children}</main>
    </div>
  )
}