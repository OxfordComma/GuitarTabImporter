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
  console.log('login session:', session)

  return (
    <main className={styles['main']}>
      <div className={styles['content']}>
        <div className={styles['text']}>
          Sign In with Google
        </div>
        <div className={styles['sign-in-button']}>
          <SignInButton
            signInAction={signInAction}
          />
        </div>
      </div>
    </main>
  );
}
