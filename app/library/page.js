'use client'
import { useState, useContext } from 'react'
import Header from '@/components/Header';
import { TabsContext } from 'components/Context.js'

import { AppShell, Center, Flex, Group, NavLink, Stack, Text, Textarea } from '@mantine/core';

export default function Home({
}) {
    let {
        userTabs
    } = useContext(TabsContext)

    const [activeTabId, setActiveTabId] = useState();

    function Editor({ tab }) {
        // console.log('editor tab:', tab)
        return (<Textarea
            variant='unstyled'
            ml={15} mr={15}
            h="100%"
            styles={{
                root: {
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                },
                wrapper: {
                    flex: 1, // Forces the wrapper to take all available space
                    display: 'flex',
                },
                input: {
                    // flex: 1,
                    fontFamily: 'var(--mantine-font-family-monospace)',
                    fontSize: '12px',
                    lineHeight: '1.25',
                },
            }}

            value={tab && tab['tabText']}
            onChange={() => { }}
            spellCheck={false}
        >

        </Textarea>)
    }

    return (
        <AppShell
            h="100vh"
            header={{ height: 50 }}
            navbar={{
                width: 300
            }}
            footer={{
                height: 25
            }}
        >
            <AppShell.Header>
                <Header />
            </AppShell.Header>

            <AppShell.Navbar h="100%" style={{ overflowY: 'scroll' }}>
                {userTabs.map(tab => (
                    <NavLink
                        key={tab['_id']}
                        label={<Stack gap={0}>
                            <Text fz="14">{tab['songName']}</Text>
                            <Text fz="12">{tab['artistName']}</Text>
                        </Stack>}
                        // leftSection={<IconSettings size={16} stroke={1.5} />}
                        onClick={() => setActiveTabId(tab['_id'])}
                        active={tab['_id'] === activeTabId}
                    />
                ))}
            </AppShell.Navbar>

            <AppShell.Main h="100%">
                <Editor tab={activeTabId && userTabs.find(t => t['_id'] === activeTabId)} />
            </AppShell.Main>

            <AppShell.Footer>
                'Footer text'
            </AppShell.Footer>
        </AppShell>

    );
}
