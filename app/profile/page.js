'use client'
import { useState, useContext, useEffect, useRef } from 'react'
import Header from '@/components/Header';

import { AppShell, Box, Button, Center, Flex, Group, Indicator, Menu, NavLink, NumberInput, Stack, Text, Textarea, Modal, TextInput, Select } from '@mantine/core';
import { useForm } from '@mantine/form';

import { authClient } from "@/lib/auth-client"
import PickerButton from "@/components/PickerButton"

export default function Home({
}) {
    const [profile, setProfile] = useState();
    const [showPicker, setShowPicker] = useState();

    useEffect(() => {
        async function fetchProfile() {
            const profileResponse = await fetch(`/api/profile`).then(r => r.json())
            console.log("profile response:", profileResponse)

            if (!profileResponse) {
                const newRecord = {
                    libraryFolder: "",
                    projectsFolder: "",
                    spotifyPlaylistId: "",
                }
                let newRecordResponse = await fetch(`api/profile`, {
                    method: 'POST',
                    body: JSON.stringify({ profile: newRecord })
                }).then(r => r.json())

                console.log('profile saved:', newRecordResponse)
                const { insertedId: _id } = newRecordResponse;
                setProfile({
                    _id,
                    ...newRecord
                })
            }
            else {
                setProfile(profileResponse)

            }
        }
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile) {
            form.setValues({
                _id: profile['_id'] ?? "",
                libraryFolder: profile['libraryFolder'] ?? "",
                projectsFolder: profile['projectsFolder'] ?? "",
                spotifyPlaylistId: profile['spotifyPlaylistId'] ?? "",
            });
        }
    }, [profile]);

    useEffect( () => {
        console.log('show picker:', showPicker)
    }, [showPicker])

    async function saveProfile(saveObj) {
        saveObj = {
            ...saveObj,
        }

        // console.log('saving tab:', saveObj)
        let savedRecord = await fetch(`api/profile`, {
            method: 'PUT',
            body: JSON.stringify({ profile: saveObj })
        }).then(r => r.json())

        console.log('profile saved:', savedRecord)

    }

    const form = useForm({
        initialValues: {
            _id: "",
            libraryFolder: "",
            projectsFolder: "",
            spotifyPlaylistId: "",
        }
    });

    return (
        <AppShell
            h="100dvh"
            header={{ height: 50 }}
        >
            <AppShell.Header>
                <Header />

            </AppShell.Header>

            <AppShell.Navbar >

            </AppShell.Navbar>

            <AppShell.Main h="100%">
                <Group h="100%" justify='center' >
                    <Stack w="50%" justify="center">
                        <form onSubmit={form.onSubmit((values) => { saveProfile(values); })}>
                            <Group align='flex-end' wrap="nowrap">
                                <TextInput
                                    w="100%"
                                    label="Library Folder"
                                    disabled
                                    key={form.key('libraryFolder')}
                                    {...form.getInputProps('libraryFolder')}
                                />
                                <Button w={200} onClick={ () => setShowPicker('library') }>Update</Button>
                            </Group>
                            <Group align='flex-end' wrap="nowrap">
                                <TextInput
                                    w="100%"
                                    label="Projects Folder"
                                    disabled
                                    key={form.key('projectsFolder')}
                                    {...form.getInputProps('projectsFolder')}
                                />
                                <Button w={200} onClick={ () => setShowPicker('projects') }>Update</Button>
                            </Group>
                            <Group align='flex-end' wrap="nowrap">
                                <TextInput
                                    w="100%"
                                    label="Spotify Playlist URI"
                                    key={form.key('spotifyPlaylistId')}
                                    {...form.getInputProps('spotifyPlaylistId')}
                                />
                                <Button w={200}>Update</Button>
                            </Group>
                            <Group justify="flex-end" mt={10}>
                                <Button type="submit">Save</Button>
                            </Group>
                        </form>
                    </Stack>
                </Group>
            </AppShell.Main>
            {showPicker && <PickerButton
                key="picker"
                // clientId={session['clientId']}
                title={`Choose ${showPicker} folder`}
                onPicked={(e) => { console.log("Picked:", e.detail); setShowPicker(); } }
                onCanceled={() => { console.log("Picker was canceled"); setShowPicker(); } }
            />}
        </AppShell>

    );
}
