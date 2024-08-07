import "./globals.css";
import styles from './layout.module.css'
import Header from 'components/Header'
import Footer from 'components/Footer'
import { SessionProvider } from "next-auth/react"
import { ErrorBoundary } from "react-error-boundary";
import { auth } from "../auth"
import { SignOutButton } from 'components/SignOut'
import { SignInButton } from 'components/SignIn'
import { Context }  from 'components/Context'

import { signIn } from "auth.js"


import { Metadata } from 'next' 
export const metadata = {
  title: 'TABR',
  description: 'TABR - The All-In-One Band Repository',
}


export default async function RootLayout({ 
  children,
  // session,
}) {
  const session = await auth()
  // console.log('layout session', session)

  if (session && session.status === 'unauthenticated') {
    redirect(`/login`) // Navigate to the new post page
  }

  async function signInAction() {
    "use server"
    return await signIn("google", { redirectTo: '/profile' })
  }

  return (
      <html lang="en" className={styles['html']}>
        <ErrorBoundary>
          <SessionProvider session={session}>
            <body className={styles['body']}>
              <div className={styles['header']}>
                <Header 
                  headings={
                    session ? {
                      'Library': '/library', 
                      'Projects': '/projects',
                      'Profile': '/profile' 
                    } : { 
                      'TABR': '/',
                    }
                  }
                />
                { session ? 
                  <SignOutButton styles={styles}/>
                  : <SignInButton styles={styles} signInAction={signInAction}/> 
                }
              </div>
              <div className={styles['content']}>
                <Context>
                  {children}
                </Context>
              </div>
              <div className={styles['footer']}>
                <Footer />
              </div>
            </body>
          </SessionProvider>
        </ErrorBoundary>
      </html>
    );
  }


