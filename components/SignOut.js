'use client'
import { signOut } from "next-auth/react"

export function SignOutButton({ styles }) {
  return (
    <div className={styles['button-container']}>
      <button className={styles['sign-out-button']} key='button' onClick={() => signOut({callbackUrl: '/login'})}>Sign Out</button>
    </div>
  )
}