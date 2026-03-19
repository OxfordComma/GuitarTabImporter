'use client'

import { Group, Anchor, Button, Modal, TextInput, Center, Stack, PasswordInput, Checkbox, Loader } from '@mantine/core'
import { authClient } from '@/lib/auth-client'
import { useDisclosure } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Header ({ 
  headings = []
}) {
  const { data: session, isPending } = authClient.useSession();

  const router = useRouter()

  if (session) {
    headings = [
      { title: 'Library', href: '/library' },
      { title: 'Projects', href: '/projects' },
    ]
  }

  function SignIn({}) {
    return (<Button onClick={() => {
      authClient.signIn.social({
        provider: "google",
        callbackURL: "/library"
      }); 
    }}>Sign In</Button>)
  }

  function SignOut({}) {
    return (<Button onClick={() => authClient.signOut({ 
      fetchOptions: { onSuccess: () => {
        router.push("/"); // redirect to login page
      }
    }}) }>Sign Out</Button>)
  }

  
  return (
    <Group flex={1} h="100%" px="md">
      <Anchor size='xl' c='white' fw={1000} href='/' component={Link}>TABR</Anchor>
      { 
        headings.map(h => (
          <Anchor c='white' key={h['title']} href={h['href']} component={Link}>{h['title']}</Anchor>
        ))
      }
      <Group ml="auto" >
        { 
          isPending ? 
            <Loader /> : 
          session ? 
            <Group> 
              <Link href="/profile">{session['user']['email']}</Link>
              <SignOut/> 
            </Group> : 
            <Group> 
              <SignIn/>
            </Group> 
          }
      </Group>

      {/* <Center>
        <Modal title={modalMethod} opened={signInOutModalOpened} onClose={close}>
          <form onSubmit={form.onSubmit((values) => onFormSubmit(values))}>
            <Stack>
              <Button type="submit">Sign in with Google</Button>
            </Stack>
          </form>
        </Modal>
      </Center> */}
    </Group>
  )
}
