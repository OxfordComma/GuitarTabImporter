'use client'
import { signOut } from "next-auth/react"


export function SignOutButton({ styles }) {
  return (
    <div>
      <button className={styles['logout-button']} key='button' onClick={() => signOut({callbackUrl: '/login'})}>Sign out</button>
    </div>
  )
}