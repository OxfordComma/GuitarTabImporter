'use client'
import { useState, useContext, useEffect, useRef } from 'react'
import Header from '@/components/Header';
import { TabsContext } from 'components/Context.js'

import { AppShell, Box, Button, Center, Flex, Group, Indicator, Menu, NavLink, NumberInput, Stack, Text, Textarea, Modal, TextInput, Select } from '@mantine/core';
import { sortBy } from 'lodash';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';

export default function Home({
}) {
	const [profile, setProfile] = useState()

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

    const form = useForm({
		initialValues: {
            _id: "",
			libraryFolder: "",
            projectsFolder: "",
            spotifyPlaylistId: "",
		}
	});

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
                            <TextInput 
                                label="Library Folder" 
                                key={form.key('libraryFolder')} 
                                {...form.getInputProps('libraryFolder')}
                            />
                            <TextInput 
                                label="Projects Folder" 
                                key={form.key('projectsFolder')} 
                                {...form.getInputProps('projectsFolder')}
                            />
                            <TextInput 
                                label="Spotify Playlist URI" 
                                key={form.key('spotifyPlaylistId')} 
                                {...form.getInputProps('spotifyPlaylistId')}
                            />
                            <Group justify="flex-end" >
                                <Button type="submit">Update</Button>
                            </Group>
                        </form>
                    </Stack>
                </Group>
			</AppShell.Main>

		</AppShell>

	);
}
