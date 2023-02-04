import React from 'react'
import styles from '../styles/globals.css'
import Layout from '../components/Layout'
import { useRouter } from 'next/router'

import { useSession, SessionProvider } from "next-auth/react"


export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
    return (
    <SessionProvider session={session}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  )
}