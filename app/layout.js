import '@mantine/core/styles.layer.css';
// import 'mantine-datatable/styles.layer.css';

import { ColorSchemeScript, MantineProvider, mantineHtmlProps, createTheme } from '@mantine/core';


// import "./globals.css";

import { ErrorBoundary } from "react-error-boundary";
import { authClient } from "@/lib/auth-client"
import { Context } from 'components/Context'

// import { signIn } from "auth.js"


// import { Metadata } from 'next'
export const metadata = {
  title: 'TABR',
  description: 'TABR - The All-In-One Band Repository',
}

const theme = createTheme({
  fontFamily: 'Georgia',
  fontFamilyMonospace: 'Monaco, Courier, monospace',
  headings: { fontFamily: 'Outfit, sans-serif' },
  defaultColorScheme: "dark",
});


export default async function RootLayout({
  children,
  // session,
}) {
  // const { data: session } = await authClient.getSession()
  // console.log('layout session', session)

  // if (session && session.status === 'unauthenticated') {
  //   redirect(`/login`) // Navigate to the new post page
  // }

  return (
    <html lang="en"  {...mantineHtmlProps}>
      <ErrorBoundary>
        <head>
          <ColorSchemeScript
            defaultColorScheme="auto"
          />
        </head>
        {/* <SessionProvider session={session}> */}
        <Context>
          <body style={{overflow: 'hidden'}}>
            <MantineProvider defaultColorScheme="auto" theme={theme} >
              {children}
            </MantineProvider>
          </body>
          {/* </SessionProvider> */}
        </Context>
      </ErrorBoundary>
    </html>
  );
}


