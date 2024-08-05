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

  async function signInAction(email, password) {
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
                  : <SignInButton signInAction={signInAction}/> 
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


// import React from 'react'
// import Header from './Header'
// import { Context }  from './Context'
// import styles from '../styles/Layout.module.css'
// import { useRouter } from 'next/router'
// import { useSession, signIn, signOut } from "next-auth/react"
// import { createContext, useContext, useState, useEffect } from "react";

// export const TabsContext = createContext([]);


// function ShowLogin() {
//   const { data: session, status } = useSession()

//   return (<div className={styles['show-login']}>
//     {session ? [
//       <p key='email' className={styles['login-email']}>{session.user.email}</p>,
//       <button className={styles['login-button']} key='button' onClick={() => signOut({callbackUrl: '/login'})}>Sign out</button>
//     ] : (
//       <button className={styles['login-button']} onClick={() => signIn('google', { callbackUrl: '/profile' })}>
//         Sign in with Google
//       </button>
//     )}
//   </div>)
  
//   // if (session) {
//   //   return ([
//   //     <p key='email' className={styles['login-email']}>{session.user.email}</p>,
//   //     <button className={styles['login-button']} key='button' onClick={() => signOut({callbackUrl: '/login'})}>Sign out</button>
//   //   ])
//   // }
//   // return (
//   //     <button className={styles['login-button']} onClick={() => signIn('google', { callbackUrl: '/import' })}>
//   //       Sign in with Google
//   //     </button>
//   // )
// }


// export default function Layout({ children }) {
//   const router = useRouter()
//   const { data: session, status } = useSession()
//   let [data, setData] = useState([])
//   let [tabs, setTabs] = useState([])

//   function selectTab(tab, idx) {
//     console.log(
//       'selectTab', idx, tab
//     )
//   }

//   useEffect(() => {
//     console.log('auth status:', status)
//     if (status == 'unauthenticated') {
//       router.push('/login')
//     }
//     // if (status == 'authenticated') {
//     //   router.push('/profile')
//     // }
//   }, [status])

//   return (
//     <div className={styles['html']}>
//       <div className={styles['layout']}>
//         <div className={styles['layout-header']}>
//           {
//             status=='unauthenticated' ? 
//               <Header 
//                 headings={{
//                   'TABR': '/login'
//                 }}
//               /> : 
//               <Header 
//                 headings={
//                   { 
//                     'Library': '/edit', 
//                     'Projects': '/projects',
//                     'Profile': '/profile' 
//                   }
//                 }
//               />
//           }
//           <ShowLogin/>
//         </div>
//         <main className={styles['layout-content']}>
//           <Context>
//             {children}
//           </Context>
//         </main>
//       </div>
//     </div>
//   )
// }

