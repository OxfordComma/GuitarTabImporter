import '@mantine/core/styles.layer.css';
// import 'mantine-datatable/styles.layer.css';

import { ColorSchemeScript, MantineProvider, mantineHtmlProps, createTheme } from '@mantine/core';
import { TabsContextProvider } from 'components/Context.js'

import { ErrorBoundary } from "react-error-boundary";

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
}) {

  return (
    <html lang="en"  {...mantineHtmlProps}>
      <ErrorBoundary>
        <head>
          <ColorSchemeScript
            defaultColorScheme="auto"
          />
        </head>
          <TabsContextProvider>
            <body style={{overflow: 'hidden'}}>
              <MantineProvider defaultColorScheme="auto" theme={theme} >
                  {children}
              </MantineProvider>
            </body>
          </TabsContextProvider>
      </ErrorBoundary>
    </html>
  );
}


