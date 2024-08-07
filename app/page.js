// import React, { useContext, Suspense } from 'react'
import styles from "./page.module.css";
// import { useNavigate } from "react-router-dom"
import { auth } from "../auth"
import { redirect } from 'next/navigation'


export default async function Home({

}) {
  let session = await auth()
  console.log('main session:', session)

  if (session && session.user) {
    redirect(`/library`) // Navigate to the new post page
  }


  return (
    <main className={styles['main']}>
      <div className={styles['content']}>
        <div className={styles['text']}>The</div>
        <div className={styles['text']}>All-In-One</div>
        <div className={styles['text']}>Band</div>
        <div className={styles['text']}>Repository</div>
      </div>
    </main>
  );
}
