import styles from "./page.module.css";
import { authClient } from "@/lib/auth-client"
import { redirect } from 'next/navigation'
import { headers } from "next/headers";

import { AppShell, AppShellHeader, AppShellMain, Stack, Text } from '@mantine/core';
import Header from "@/components/Header";


export default async function Home({

}) {
  const session = await authClient.getSession();
  console.log('main session:', session)

  if (session && session.user) {
    redirect(`/library`) // Navigate to the new post page
  }


  return (
    <AppShell
      padding="md"
      header={{ height: 50 }}
    >
      <AppShellHeader>
        <Header/>
      </AppShellHeader>

      <AppShellMain h="100vh" w="100vw">
        <Stack gap={0} style={{WebkitTextStroke: '1px white'}}>
          <Text fz="5em" className={styles.text}>The</Text>
          <Text fz="5em" className={styles.text}>All-In-One</Text>
          <Text fz="5em" className={styles.text}>Band</Text>
          <Text fz="5em" className={styles.text}>Repository</Text>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}
