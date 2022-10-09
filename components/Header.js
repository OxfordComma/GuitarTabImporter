import styles from '../styles/Header.module.css'
import { useSession, signIn, signOut } from "next-auth/react"
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'


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

export default function Header (props) {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  useEffect(() => {
    if (status == 'unauthenticated') {
      router.push('/login')
    }
  }, [session, status])

	return (
    <div className={styles.header}>
      {status == 'authenticated' ?  [
        <Link href='/import'>Import</Link>,
        <Link href='/tabs'>Tabs</Link>,
        <Link href='/profile'>Profile</Link>
      ] :
      <div></div>}
      <div className={styles.login}>
        <ShowLogin className={styles.headeritem}/>
      </div>
    </div>	
	)
}