'use client'
import { useState, useContext, useEffect, useRef } from 'react'
import Header from '@/components/Header';
import { TabsContext } from 'components/Context.js'

import { AppShell, Box, Button, Center, Flex, Group, Indicator, Menu, NavLink, NumberInput, Stack, Text, Textarea, Modal, TextInput, Select, Checkbox, Progress, Burger } from '@mantine/core';
import { sortBy, orderBy, filter } from 'lodash';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconCheck, IconTriangle, IconTriangleInverted } from '@tabler/icons-react';
import Editor from '@/components/Editor';

import { syncToSpotify } from '@/lib/spotify';

import { formatRawTabs, getTabStaff, getChordList  } from '@/lib/tabhelper';


function EditModal({ opened, close, tab, saveTab, isNewTab }) {
	const form = useForm({
		initialValues: {
			_id: undefined,
			artistName: "",
			capo: 0,
			columnSplit: 50,
			createdTime: new Date(),
			draft: true,
			fontSize: 9,
			googleDocsId: "",
			holiday: false,
			lastUpdatedTime: new Date(),
			songName: "",
			tabText: "",
			tuning: "EADGBe"
		}
	});

	useEffect(() => {
		if (tab) {
			form.setValues({
				_id: tab?._id ?? undefined,
				artistName: tab?.artistName ?? "",
				capo: tab?.capo ?? 0,
				columnSplit: tab?.columnSplit ?? 50,
				createdTime: new Date(tab?.createdTime) ?? new Date(),
				draft: tab?.draft ?? true,
				fontSize: tab?.fontSize ?? 9,
				googleDocsId: tab?.googleDocsId ?? "",
				holiday: tab?.holiday ?? false,
				lastUpdatedTime: new Date(tab?.lastUpdatedTime) ?? new Date(),
				songName: tab?.songName ?? "",
				tabText: tab?.tabText ?? "",
				tuning: tab?.tuning ?? "EADGBe"
			});
		}
	}, [tab?._id]); // Only runs when the actual tab ID changes

	useEffect(() => {
		if (isNewTab) {
			form.reset();
		}
	}, [isNewTab])

	return (
		<Modal opened={opened} onClose={close} title="Edit Tab" centered>
			<form onSubmit={form.onSubmit((values) => { saveTab(values); close() })}>
				<Stack>
					<TextInput label="Song Name" key={form.key('songName')} {...form.getInputProps('songName')} />
					<TextInput label="Artist Name" key={form.key('artistName')} {...form.getInputProps('artistName')} />
					<Select label="Tuning" key={form.key('tuning')} {...form.getInputProps('tuning')} data={['EADGBe', 'EbAbDbGbBbeb', 'DADGBe', 'DADF#AD']} />
					<NumberInput label="Capo" key={form.key('capo')} {...form.getInputProps('capo')} />
					<Checkbox label="Draft" defaultChecked={(tab && 'draft' in tab) ? tab['draft'] : true} key={form.key('draft')} {...form.getInputProps('draft')} />
					<Group justify="flex-end" mt="md">
						<Button type='submit'>Save</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	)
}

function DeleteModal({ opened, close, tab, deleteTab }) {
	const form = useForm({
		initialValues: {
			name: `${tab?.songName} - ${tab?.artistName}`,
		}
	});


	return (
		<Modal opened={opened} onClose={close} title="Delete Tab" centered>
			Are you sure you would like to delete the tab {`${tab?.songName} - ${tab?.artistName}`}?
			<form onSubmit={form.onSubmit((values) => deleteTab(tab))}>
				<Group justify="flex-end" mt="md">
					<Button type='submit' color='red'>Delete</Button>
				</Group>
			</form>
		</Modal>
	)
}

export default function Home({
}) {
	let {
		userTabs, setUserTabs
	} = useContext(TabsContext)

	const [tabs, setTabs] = useState([]);
	const [activeTab, setActiveTab] = useState();

	const [modified, setModified] = useState(false);
	const [sortStatus, setSortStatus] = useState({ 
		columnName: 'lastUpdatedTime',
		columnAccessor: d => new Date(d['lastUpdatedTime']),
		direction: 'desc',
	});
	const [filterStatus, setFilterStatus] = useState({ });
	const [isNewTab, setIsNewTab] = useState(false);
	// const [editorText, setEditorText] = useState("")
    const [syncStatus, setSyncStatus] = useState({ current: 0, total: 0, label: '' });
	const [footerText, setFooterText] = useState();
	
	
	const editorTextRef = useRef("");

	const [editModalOpened, editModalHandlers] = useDisclosure();
	const [deleteModalOpened, deleteModalHandlers] = useDisclosure();
	const [sidebarOpened, sidebarHandlers] = useDisclosure(true);

	// useEffect(() => {
	// 	setTabs(userTabs)
	// }, [userTabs]);

	useEffect(() => {
		const sortedTabs = orderBy(userTabs, sortStatus?.columnAccessor, [sortStatus?.direction])
		const filteredTabs = filter(sortedTabs, filterStatus?.filterFunction)
		setTabs(filteredTabs)
	}, [sortStatus, filterStatus, userTabs]);


	async function saveTab(saveObj) {
		saveObj = {
			...saveObj,
			tabText: isNewTab ? "" : editorTextRef.current,
			lastUpdatedTime: new Date(),
		}
		console.log('saving tab:', saveObj)
		setFooterText('Exporting Tab...')

		// Export to Google Docs
		let exportedDocument = await fetch(`api/document`, {
			method: 'PUT',
			body: JSON.stringify({ tab: saveObj })
		}).then(r => r.json())

		console.log('exported tab:', exportedDocument)

		saveObj = {
			...saveObj,
			googleDocsId: exportedDocument.id,
		}
		setFooterText('Saving Tab...')

		if (isNewTab) {
			let savedTab = await fetch(`api/tab`, {
				method: 'POST',
				body: JSON.stringify({ tab: saveObj })
			}).then(r => r.json())

			console.log('new tab saved:', savedTab)

			saveObj = {
				...saveObj,
				'_id': savedTab['insertedId'],
			}

			setUserTabs(
				[saveObj, ...userTabs]
			)
			editorTextRef.current = ""

			setActiveTab(saveObj)
		}
		else {
			let savedTab = await fetch(`api/tab?id=${saveObj['_id']}`, {
				method: 'PUT',
				body: JSON.stringify({ tab: saveObj })
			}).then(r => r.json())

			console.log('existing tab saved:', savedTab)

			setUserTabs(
				userTabs.map(t => t['_id'] === saveObj['_id'] ? saveObj : t)
			)

			setActiveTab(saveObj)

		}	

		setIsNewTab(false)
		setModified(false)
		setFooterText('')
	}

	async function deleteTab(deleteObj) {
		let deletedRecord = await fetch(`api/tab?id=${deleteObj['_id']}`, {
			method: 'DELETE',
			body: JSON.stringify({ tab: deleteObj })
		}).then(r => r.json())

		console.log('record deleted:', deletedRecord)

		// Delete from Google Docs
		let deletedDoc = await fetch(`api/document`, {
			method: 'DELETE',
			body: JSON.stringify({ record: deleteObj })
		}).then(r => r.json());
		
		console.log('doc deleted:', deletedDoc)
		
		deleteModalHandlers.close();

		setUserTabs(
			userTabs.filter(t => t['_id'] !== deleteObj['_id'])
		)
		
		setActiveTab();
	}

	function newMenu() {
		setIsNewTab(true)
		editModalHandlers.open()
	}

	function editMenu() {
		editModalHandlers.open()
	}

	function saveMenu() {
		saveTab(activeTab)
	}

	async function updateSpotifyPlaylistMenu() {
		const profile = await fetch(`/api/profile`).then(r => r.json())

		let spotifyPlaylistId;

		if (profile["spotifyPlaylistId"] === null) {
			// Create new playlist for the project
			let libraryPlaylist = await fetch(`api/spotify/playlist`, {
				method: 'POST',
				body: JSON.stringify({ name: "Library" })
			}).then(r => r.json())

			console.log('library playlist created:', projectPlaylist)
			const { id } = libraryPlaylist.body;
			spotifyPlaylistId = id;

			let saveObj = {
				...profile,
				spotifyPlaylistId
			}

			let savedRecord = await fetch(`api/profile`, {
				method: 'PUT',
				body: JSON.stringify({ profile: saveObj })
			}).then(r => r.json())
		}
		else {
			spotifyPlaylistId = profile["spotifyPlaylistId"]
		}

		syncToSpotify(userTabs, spotifyPlaylistId, setSyncStatus)
	}

	return (
		<AppShell
			h="100dvh"
			style={{ overflow: 'hidden' }}
			header={{ height: 50 }}
			navbar={{
				width: 300,
				breakpoint: 'sm',
				collapsed: { mobile: !sidebarOpened, desktop: !sidebarOpened },
			}}
			footer={{
				height: 25
			}}
		>
			<AppShell.Header>
				<Group h="100%" >
					<Burger ml={10} opened={sidebarOpened} onClick={() => sidebarHandlers.toggle() } />
					<Header />
				</Group>
			</AppShell.Header>

			<AppShell.Navbar >
				<AppShell.Section>
					<Group gap={0} justify='space-between' wrap='nowrap'>
					<Menu position='bottom-start' shadow="md" color="#4B0082">
						<Menu.Target>
							<Button size='xs'>file</Button>
						</Menu.Target>

						<Menu.Dropdown>
							<Menu.Item
								onClick={() => newMenu()}
							>
								New
							</Menu.Item>
							<Menu.Item
								onClick={() => editMenu()}
								disabled={!activeTab}
							>
								Edit
							</Menu.Item>
							<Menu.Item
								// onClick={() => importMenu()}
								disabled
							>
								Import
							</Menu.Item>
							<Menu.Item
								onClick={() => saveMenu()}
								disabled={activeTab === undefined}
							>
								Save
							</Menu.Item>
							<Menu.Item
								color="red"
								onClick={() => deleteModalHandlers.open()}
								disabled={activeTab === undefined}
							>
								Delete
							</Menu.Item>
							
						</Menu.Dropdown>
					</Menu>

					<Menu position='bottom-start' shadow="md" color="#4B0082">

						<Menu.Target>
							<Button size='xs'>social</Button>
						</Menu.Target>
						<Menu.Dropdown>
						<Menu.Item
							onClick={() => window.open(`https://docs.google.com/document/d/${activeTab['googleDocsId']}/edit`)}
							disabled={activeTab === undefined}
						>
							Open in Docs
						</Menu.Item>
						<Menu.Item
							onClick={() => updateSpotifyPlaylistMenu() }
							disabled={userTabs.length === 0}
						>
							Update Spotify playlist
						</Menu.Item>
						</Menu.Dropdown>

					</Menu>

					<Menu position='bottom-start' shadow="md" color="#4B0082">
						<Menu.Target>
							<Button size='xs'>tools</Button>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Item
								onClick={() => {
									const newText = formatRawTabs(editorTextRef.current, 2);
									editorTextRef.current = newText;
									setActiveTab({ ...activeTab, tabText: newText } );
								}}
								disabled={userTabs.length === 0}
							>
								Format 2 chords per line
							</Menu.Item>
							<Menu.Item
								onClick={() => {
									const newText = formatRawTabs(editorTextRef.current, 4);
									editorTextRef.current = newText;
									setActiveTab({ ...activeTab, tabText: newText } );
								}}
								disabled={userTabs.length === 0}
							>
								Format 4 chords per line
							</Menu.Item>
							<Menu.Item
								onClick={() => { 
									const newText = `${editorTextRef.current}\n${getTabStaff()}`;
									editorTextRef.current = newText;
									setActiveTab({ ...activeTab, tabText: newText } )
								}}
								disabled={userTabs.length === 0}
							>
								Add tab staff
							</Menu.Item>
							<Menu.Item
								onClick={() => { 
									const newText = `${editorTextRef.current}\n${getChordList(editorTextRef.current).join('\t')}`;
									editorTextRef.current = newText;
									setActiveTab({ ...activeTab, tabText: newText } )
								}}
								disabled={userTabs.length === 0}
							>
								Create chord list
							</Menu.Item>
							<Menu.Item
								// onClick={() => newCollectionMenu()}
								disabled
							>
								Convert chords to tabs
							</Menu.Item>
							<Menu.Item
								// onClick={() => newCollectionMenu()}
								disabled
							>
								Toggle two column mode
							</Menu.Item>
						</Menu.Dropdown>
					</Menu>
					
					<Menu position='bottom-start' shadow="md" color="#4B0082">
						<Menu.Target>
							<Button size='xs'>sort</Button>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Item
								onClick={() => setSortStatus({})}
								rightSection={Object.keys(sortStatus).length === 0 && (<IconCheck size={12}/>)}
							>
								None
							</Menu.Item>
							<Menu.Item
								onClick={() => setSortStatus({
									columnName: 'artistName',
									columnAccessor: 'artistName',
									direction: sortStatus?.['direction'] === 'asc' ? 'desc' : 'asc'
								})}
								rightSection={
									sortStatus?.columnName ==='artistName' && sortStatus?.['direction'] === 'asc' && (<IconTriangleInverted size={12}/>) || 
									sortStatus?.columnName ==='artistName' && sortStatus?.['direction'] === 'desc' && (<IconTriangle size={12}/>)
								}
							>
								Artist
							</Menu.Item>
							<Menu.Item
								onClick={() => setSortStatus({
									columnName: 'songName',
									columnAccessor: 'songName',
									direction: sortStatus?.['direction'] === 'asc' ? 'desc' : 'asc'
								})}
								rightSection={
									sortStatus?.columnName ==='songName' && sortStatus?.['direction'] === 'asc' && (<IconTriangleInverted size={12}/>) || 
									sortStatus?.columnName ==='songName' && sortStatus?.['direction'] === 'desc' && (<IconTriangle size={12}/>)
								}
							>
								Song
							</Menu.Item>
							<Menu.Item
								onClick={() => setSortStatus({
									columnName: 'createdTime',
									columnAccessor: d => new Date(d['createdTime']),
									direction: sortStatus?.['direction'] === 'asc' ? 'desc' : 'asc'
								})}
								rightSection={
									sortStatus?.columnName ==='createdTime' && sortStatus?.['direction'] === 'asc' && (<IconTriangle size={12}/>) || 
									sortStatus?.columnName ==='createdTime' && sortStatus?.['direction'] === 'desc' && (<IconTriangleInverted size={12}/>)
								}
							>
								Created
							</Menu.Item>
							<Menu.Item
								onClick={() => setSortStatus({
									columnName: 'lastModifiedTime',
									columnAccessor: d => new Date(d['lastModifiedTime']),
									direction: sortStatus?.['direction'] === 'asc' ? 'desc' : 'asc'
								})}
								rightSection={
									sortStatus?.columnName ==='lastModifiedTime' && sortStatus?.['direction'] === 'asc' && (<IconTriangle size={12}/>) || 
									sortStatus?.columnName ==='lastModifiedTime' && sortStatus?.['direction'] === 'desc' && (<IconTriangleInverted size={12}/>)
								}
							>
								Last modified
							</Menu.Item>
						</Menu.Dropdown>
					</Menu>

					<Menu position='bottom-start' shadow="md" color="#4B0082">
						<Menu.Target>
							<Button size='xs'>filter</Button>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Sub openDelay={120} closeDelay={150}>
								<Menu.Sub.Target>
									<Menu.Sub.Item>capo</Menu.Sub.Item>
								</Menu.Sub.Target>

								<Menu.Sub.Dropdown>
									<Menu.Item
										onClick={() => {
											// setTabs(userTabs)
											setFilterStatus({ })
										}}
										rightSection={Object.keys(filterStatus).length === 0 && (<IconCheck size={12}/>)}
									>
										all
									</Menu.Item>
									<Menu.Item
										onClick={() => {
											// setTabs(userTabs.filter(t => t['capo'] && t['capo'] > 0))
											setFilterStatus({ 
												columnAccessor: 'capo',
												filterFunction: t => t['capo'] && t['capo'] > 0,
											})
										}}
										rightSection={filterStatus?.columnAccessor === 'capo' && (<IconCheck size={12}/>)}
									>
										yes
									</Menu.Item>
									<Menu.Item
										onClick={() => {
											// setTabs(userTabs.filter(t => t['capo'] === 0 || t['capo']))
											setFilterStatus({
												columnAccessor: 'no capo',
												filterFunction: t => t['capo'] === 0 || t['capo']
											})
										}}
										rightSection={filterStatus?.columnAccessor === 'no capo' && (<IconCheck size={12}/>)}
										
									>
										no
									</Menu.Item>
								</Menu.Sub.Dropdown>
							</Menu.Sub>
							<Menu.Sub openDelay={120} closeDelay={150}>
								<Menu.Sub.Target>
									<Menu.Sub.Item>tuning</Menu.Sub.Item>
								</Menu.Sub.Target>

								<Menu.Sub.Dropdown>
									<Menu.Item
										onClick={() => {
											// setTabs(userTabs)
											setFilterStatus({ })
										}}
										rightSection={Object.keys(filterStatus).length === 0 && (<IconCheck size={12}/>)}
									>
										all
									</Menu.Item>
									<Menu.Item
										onClick={() => {
											// setTabs(userTabs.filter(t => t['tuning'] && t['tuning'] === 'EADGBe'))
											setFilterStatus({
												columnAccessor: 'tuning EADGBe',
												filterFunction: t => t['tuning'] && t['tuning'] === 'EADGBe',
											})
										}}
										rightSection={filterStatus?.columnAccessor === 'tuning EADGBe' && (<IconCheck size={12}/>)}
									>
										Standard
									</Menu.Item>
									<Menu.Item
										onClick={() => {
											// setTabs(userTabs.filter(t => t['tuning'] && t['tuning'] === 'EbAbDbGbBbeb'))
											setFilterStatus({
												columnAccessor: 'tuning EbAbDbGbBbeb',
												filterFunction: t => t['tuning'] && t['tuning'] === 'EbAbDbGbBbeb',
											})
										}}
										rightSection={filterStatus?.columnAccessor === 'tuning EbAbDbGbBbeb' && (<IconCheck size={12}/>)}
									>
										1/2 Step Down
									</Menu.Item>
									<Menu.Item
										onClick={() => {
											// setTabs(userTabs.filter(t => t['tuning'] && t['tuning'] === 'DADGBe'))
											setFilterStatus({
												columnAccessor: 'tuning DADGBe',
												filterFunction: t => t['tuning'] && t['tuning'] === 'DADGBe',
											})
										}}
										rightSection={filterStatus?.columnAccessor === 'tuning DADGBe' && (<IconCheck size={12}/>)}
									>
										Drop D
									</Menu.Item>
									<Menu.Item
										onClick={() => {
											// setTabs(userTabs.filter(t => t['tuning'] && t['tuning'] === 'DADF#Ad'))
											setFilterStatus({
												columnAccessor: 'tuning DADF#AD',
												filterFunction: t => t['tuning'] && t['tuning'] === 'DADF#Ad',
											})
										}}
										rightSection={filterStatus?.columnAccessor === 'tuning DADF#AD' && (<IconCheck size={12}/>)}
									>
										DADF#AD
									</Menu.Item>
									<Menu.Item
										onClick={() => {
											// setTabs(userTabs.filter(t => t['tuning'] && !['EADGBe', 'EbAbDbGbBbeb', 'DADGBe', 'DADF#Ad'].includes(t['tuning'])))
											setFilterStatus({
												columnAccessor: 'tuning other',
												filterFunction: t => t['tuning'] && !['EADGBe', 'EbAbDbGbBbeb', 'DADGBe', 'DADF#Ad'].includes(t['tuning']),
											})
										}}
										rightSection={filterStatus?.columnAccessor === 'tuning other' && (<IconCheck size={12}/>)}
									>
										Other
									</Menu.Item>
								</Menu.Sub.Dropdown>
							</Menu.Sub>
							
							<Menu.Sub openDelay={120} closeDelay={150}>
								<Menu.Sub.Target>
									<Menu.Sub.Item>draft</Menu.Sub.Item>
								</Menu.Sub.Target>

								<Menu.Sub.Dropdown>
									<Menu.Item
										onClick={() => {
											// setTabs(userTabs)
											setFilterStatus({ })
										}}
										rightSection={Object.keys(filterStatus).length === 0 && (<IconCheck size={12}/>)}
									>
										all
									</Menu.Item>
									<Menu.Item
										onClick={() => {
											// setTabs(userTabs.filter(t => t['tuning'] && t['tuning'] === 'EADGBe'))
											setFilterStatus({
												columnAccessor: 'is draft',
												filterFunction: t => t['draft'],
											})
										}}
										rightSection={filterStatus?.columnAccessor === 'is draft' && (<IconCheck size={12}/>)}
									>
										yes
									</Menu.Item>
									<Menu.Item
										onClick={() => {
											// setTabs(userTabs.filter(t => t['tuning'] && t['tuning'] === 'EADGBe'))
											setFilterStatus({
												columnAccessor: 'is not draft',
												filterFunction: t => !t['draft'],
											})
										}}
										rightSection={filterStatus?.columnAccessor === 'is not draft' && (<IconCheck size={12}/>)}
									>
										no
									</Menu.Item>
								</Menu.Sub.Dropdown>
							</Menu.Sub>
						</Menu.Dropdown>
					</Menu>
					</Group>
				</AppShell.Section>

				<AppShell.Section h="100%" style={{ overflowY: 'scroll' }}>
					{tabs.map(tab => (
						<NavLink
							key={tab['_id']}
							label={
								<Indicator offset={5} color='red' disabled={!(activeTab && (tab['_id'] === activeTab['_id']) && modified)}>
									<Stack gap={0}>
										<Text fz="14">{tab['songName']}</Text>
										<Text fz="12">{tab['artistName']}</Text>
									</Stack>
								</Indicator>
							}
							// leftSection={<IconSettings size={16} stroke={1.5} />}
							onClick={() => { setActiveTab(tab); setModified(false); editorTextRef.current = tab['tabText'] }}
							active={activeTab && tab['_id'] === activeTab['_id']}
						/>
					))}
				</AppShell.Section>
			</AppShell.Navbar>

			<AppShell.Main h="100%" >
				<AppShell.Section>
					<Group gap={0} pl={15} pr={15} style={{ borderBottom: '1px solid var(--app-shell-border-color)' }} h="auto">
						{activeTab && <Group>
							<Button h="auto" onClick={() => setActiveTab({ ...activeTab, fontSize: activeTab.fontSize - 0.5})}>-</Button>
							<Text w={15} m={0} align="center">{activeTab?.fontSize}</Text>
							<Button h="auto" onClick={() => setActiveTab({ ...activeTab, fontSize: activeTab.fontSize + 0.5})}>+</Button>
						</Group>}
						<Group flex={1} justify='center' >
							<Text >
								{activeTab && `${activeTab['songName'].replaceAll(/[ ',.]/g, '').toLowerCase()}.${activeTab['artistName'].replaceAll(/[ ',.]/g, '').toLowerCase()}.tab`}
							</Text>
						</Group>
						<Group ml="auto">
							{activeTab && activeTab['capo'] > 0 && (<Text>capo {activeTab['capo']} </Text>)}
							{activeTab && activeTab['tuning'] && (<Text>{activeTab['tuning']} </Text>)}
						</Group>
					</Group>
				</AppShell.Section>

				<AppShell.Section h="95%" grow style={{ overflow: 'none' }}>
					<Editor
						key={activeTab?.['_id']}
						initialText={activeTab?.tabText ?? ""}
						fontSize={activeTab?.['fontSize']}
						onTextChange={(val) => {
							editorTextRef.current = val;
							if (!modified) setModified(true);
						}}
					/>
				</AppShell.Section>

				<EditModal
					opened={editModalOpened}
					close={editModalHandlers.close}
					tab={activeTab}
					saveTab={saveTab}
					isNewTab={isNewTab}
				/>
				<DeleteModal
					opened={deleteModalOpened}
					close={deleteModalHandlers.close}
					tab={activeTab}
					deleteTab={deleteTab}
				/>
			</AppShell.Main>

			<AppShell.Footer>
				<Group h="100%" justify='flex-end' align='center' wrap="nowrap" >
					{footerText && <Text>{footerText}</Text>}
					{syncStatus.total > 0 && (<Group w="fit-content" wrap="nowrap">
						<Text>{syncStatus.label}</Text>
						<Progress w={300} justify="center" flex={1} value={(syncStatus.current / syncStatus.total) * 100} animated mr="sm" />
					</Group>)}
				</Group>
			</AppShell.Footer>
		</AppShell>

	);
}
