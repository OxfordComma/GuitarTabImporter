'use client'
import { useState, useContext, useEffect, useRef } from 'react'
import Header from '@/components/Header';

import { AppShell, Box, Button, Center, Flex, Group, Indicator, Menu, NavLink, NumberInput, Stack, Text, Textarea, Modal, TextInput, Select, Progress } from '@mantine/core';
import { useForm } from '@mantine/form';

import { authClient } from "@/lib/auth-client"
import PickerButton from "@/components/PickerButton"

// import SpotifySync from '@/components/SpotifySync';
import { TabsContext } from 'components/Context.js'

import { syncToSpotify } from '@/lib/spotify';

export default function Home({
}) {
	const [profile, setProfile] = useState();
	const [showPicker, setShowPicker] = useState();
    const [syncStatus, setSyncStatus] = useState({ current: 0, total: 0, label: '' });

	let {
		userTabs,
		userProjects, 
	} = useContext(TabsContext)

	useEffect(() => {
		async function fetchProfile() {
			const profileResponse = await fetch(`/api/profile`).then(r => r.json())

			if (!profileResponse) {
				const newRecord = {
					libraryFolder: null,
					projectsFolder: null,
					spotifyPlaylistId: null,
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
					<Stack w="50%" justify="center" >
						<form onSubmit={form.onSubmit((values) => { saveProfile(values); })}>
							<Group align='flex-end' justify="space-between" wrap="nowrap">
								<TextInput
									// w="100%"
									label="Library Folder"
									disabled
									key={form.key('libraryFolder')}
									{...form.getInputProps('libraryFolder')}
								/>
								<Button w={300} onClick={ () => setShowPicker('library') }>Update Library Folder</Button>
							</Group>
							<Group align='flex-end' justify="space-between" wrap="nowrap">
								<TextInput
									// w="100%"
									label="Projects Folder"
									disabled
									key={form.key('projectsFolder')}
									{...form.getInputProps('projectsFolder')}
								/>
								<Button w={300} onClick={ () => setShowPicker('projects') }>Update Projects Folder</Button>
							</Group>
							<Group align='flex-end' justify="flex-end" wrap="nowrap">
								<Button w={300} color="#1ED761" onClick={async () => {
									authClient.linkSocial({
										provider: "spotify",
										callbackURL: "/profile"
									})
								}}>Sign in with Spotify</Button>

							</Group>
						</form>
					</Stack>
				</Group>
			</AppShell.Main>
			{showPicker && <PickerButton
				key="picker"
				title={`Choose ${showPicker} folder`}
				onPicked={(e) => { console.log("Picked:", e.detail); setShowPicker(); } }
				onCanceled={() => { console.log("Picker was canceled"); setShowPicker(); } }
			/>}
		</AppShell>

	);
}
