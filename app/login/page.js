'use server'
import React, { useContext } from 'react'
import { signIn } from "auth.js"

import { SignInButton } from 'components/SignIn'
import styles from './page.module.css'

import {auth} from 'auth'
import authConfig from "auth.config"

async function signInAction(email, password) {
  "use server"
  await signIn("google", { redirectTo: '/profile' })
}


export default async function Login() {
  let session = await auth()
  // console.log('login session:', session)

  if (session && session.user) {
    redirect(`/profile`) // Navigate to the new post page
  }

  return (
    <main className={styles['main']}>
      <div className={styles['content']}>
        <div className={styles['text']}>
          <h1>Sign In with Google</h1>
          <p> 
            Signing in uses OAuth for authentication with Google.<br/>
            TABR will only need access to the folder you wish to use as your library.<br/>
          </p>
        </div>
        {/*<div className={styles['sign-in-button']}>
          <SignInButton
            signInAction={signInAction}
            styles={styles}
          />
        </div>*/}
      </div>
    </main>
  );
}
