'use client'
import { TabsContext } from 'components/Context.js'
import { useState, useEffect, useContext } from 'react'
import Header from '@/components/Header';
import { AppShell, Box, Button, Center, Flex, Group, Indicator, Menu, NavLink, NumberInput, Stack, Text, Textarea, Modal, TextInput, Select, Checkbox, Progress, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import Editor from '@/components/Editor';
import { syncToSpotify } from '@/lib/spotify';


function OpenModal({ opened, close, projects, submit }) {
	const form = useForm({
		initialValues: {
			// _id: undefined,
			// name: ""
		}
	});
	const [projectId, setProjectId] = useState();


	return (
		<Modal opened={opened} onClose={close} title="Open Project" centered>
			<form onSubmit={form.onSubmit(() => { submit(projectId); form.reset(); close() })}>
				<Stack>
					<Select
						data={projects.map(p => ({
							value: p._id,
							label: `${p?.name}`
						}))}
						value={projectId}
						onChange={(value, option) => setProjectId(value)}
						searchable
					/>
					<Group justify="flex-end" mt="md">
						<Button type='submit'>Open</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	)
}

function EditModal({ opened, close, object: project, submit, isNew }) {
	const form = useForm({
		initialValues: {
			_id: null,
			folder: null,
			name: "",
			tabIds: [],
			collaborators: [],
			createdTime: new Date(),
			lastUpdatedTime: new Date(),
			spotifyPlaylistId: null,

		}
	});

	useEffect(() => {
		if (project) {
			form.setValues({
				// _id: project?._id ?? undefined,
				// name: project?.name ?? ""
				...project,
			});
		}
	}, [project?._id]); // Only runs when the actual tab ID changes

	useEffect(() => {
		if (isNew) {
			form.reset();
		}
		console.log('isNew', isNew)
	}, [isNew])

	return (
		<Modal opened={opened} onClose={close} title="Edit Project" centered>
			<form onSubmit={form.onSubmit((values) => { submit(values); form.reset(); close() })}>
				<Stack>
					<TextInput label="Project Name" key={form.key('name')} {...form.getInputProps('name')} />
					{/* <TextInput label="Artist Name" key={form.key('artistName')} {...form.getInputProps('artistName')} />
					<Select label="Tuning" key={form.key('tuning')} {...form.getInputProps('tuning')} data={['EADGBe', 'EbAbDbGbBbeb', 'DADGBe', 'DADF#AD']} />
					<NumberInput label="Capo" key={form.key('capo')} {...form.getInputProps('capo')} />
					<Checkbox label="Draft" checked={tab?.['draft']} key={form.key('draft')} {...form.getInputProps('draft')} /> */}
					<Group justify="flex-end" mt="md">
						<Button type='submit'>Save</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	)
}

function DeleteModal({ opened, close, object: project, submit }) {
	const form = useForm({
		initialValues: {
			// name: `${tab?.songName} - ${tab?.artistName}`,
		}
	});


	return (
		<Modal opened={opened} onClose={close} title="Delete Projects" centered>
			Are you sure you would like to delete the project {`${project?.name}`}?
			<form onSubmit={form.onSubmit((values) => submit(project))}>
				<Group justify="flex-end" mt="md">
					<Button type='submit' color='red'>Delete</Button>
				</Group>
			</form>
		</Modal>
	)
}

function PickTabModal({ opened, close, tabs, submit }) {
	const form = useForm({
		initialValues: {
			// _id: undefined,
			// name: ""
		}
	});

	const [tabId, setTabId] = useState();

	return (
		<Modal opened={opened} onClose={close} title="Edit Project" centered>
			<form onSubmit={form.onSubmit(() => {
				if (tabId) {
					submit(tabId); form.reset(); close();
				}
			})}>
				<Stack>
					<Select
						data={tabs.map(t => ({
							value: t._id,
							label: `${t?.songName} - ${t?.artistName}`
						}))}
						value={tabId}
						onChange={(value, option) => setTabId(value)}
						searchable
					/>
					<Group justify="flex-end" mt="md">
						<Button type='submit'>Save</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	)
}

export default function Projects({ }) {
	let {
		userTabs, setUserTabs,
		userProjects, setUserProjects,
	} = useContext(TabsContext)

	const [projects, setProjects] = useState([]);
	const [activeProject, setActiveProject] = useState();
	const [activeTab, setActiveTab] = useState();
	const [isNew, setIsNew] = useState(false);
	const [pickTabMode, setPickTabMode] = useState();
	const [syncStatus, setSyncStatus] = useState({ current: 0, total: 0, label: '' });
	const [footerText, setFooterText] = useState();

	const [openModalOpened, openModalHandlers] = useDisclosure();
	const [editModalOpened, editModalHandlers] = useDisclosure();
	const [deleteModalOpened, deleteModalHandlers] = useDisclosure();
	const [pickTabModalOpened, pickTabModalHandlers] = useDisclosure();
	const [sidebarOpened, sidebarHandlers] = useDisclosure(true);

	useEffect(() => {
		// const sortedTabs = sortBy(userTabs, sortStatus?.columnAccessor)
		// const filteredTabs = filter(sortedTabs, filterStatus?.filterFunction)
		setProjects(userProjects);
	}, [
		// sortStatus, filterStatus, 
		userProjects
	]);

	function newMenu() {
		setIsNew(true)
		editModalHandlers.open()
	}

	function openMenu() {
		openModalHandlers.open()
	}

	function editMenu() {
		setIsNew(false)
		editModalHandlers.open()
	}

	function saveMenu() {
		saveProject(activeProject)
	}

	function deleteMenu() {
		deleteModalHandlers.open()
	}

	async function updateSpotifyPlaylistMenu() {
		const userTabsMap = new Map(userTabs.map(ut => [ut['_id'], ut]));
		const projectTabs = activeProject?.tabIds.map(t => userTabsMap.get(t['tabId']));

		let spotifyPlaylistId;

		if (activeProject["spotifyPlaylistId"] === null) {
			// Create new playlist for the project
			let projectPlaylist = await fetch(`api/spotify/playlist`, {
				method: 'POST',
				body: JSON.stringify({ name: activeProject['name'] })
			}).then(r => r.json())

			console.log('project playlist created:', projectPlaylist)
			const { id } = projectPlaylist.body;
			spotifyPlaylistId = id;

			let saveObj = {
				...activeProject,
				spotifyPlaylistId
			}

			saveProject(saveObj)
		}
		else {
			spotifyPlaylistId = activeProject["spotifyPlaylistId"]
		}

		syncToSpotify(projectTabs, spotifyPlaylistId, setSyncStatus)
	}

	async function saveProject(saveObj) {
		saveObj = {
			...saveObj,
			lastUpdatedTime: new Date(),
		}

		console.log('saving project:', saveObj)

		if (isNew) {
			// Create folder in projects folder for new project
			let projectFolder = await fetch(`api/folder`, {
				method: 'POST',
				body: JSON.stringify({ name: saveObj['name'] })
			}).then(r => r.json())

			console.log('project folder created:', projectFolder)
			// Add google drive folder id to save object
			saveObj = {
				...saveObj,
				folder: projectFolder?.['data']?.['id'],
			}

			// Save project to database with new folder id
			let savedProject = await fetch(`api/project`, {
				method: 'POST',
				body: JSON.stringify({ record: saveObj })
			}).then(r => r.json())

			console.log('new project saved:', savedProject)

			saveObj = {
				...saveObj,
				'_id': savedProject['insertedId'],
			}

			setUserProjects(
				[saveObj, ...userProjects]
			)

			setActiveProject(saveObj)
		}
		else {
			// Create folder in projects folder for new project
			let projectFolder = await fetch(`api/folder`, {
				method: 'PUT',
				body: JSON.stringify({
					id: saveObj['folder'],
					name: saveObj['name'],
				})
			}).then(r => r.json())

			console.log('project folder updated:', projectFolder)
			
			// Add google drive folder id to save object
			let savedTab = await fetch(`api/project?id=${saveObj['_id']}`, {
				method: 'PUT',
				body: JSON.stringify({ record: saveObj })
			}).then(r => r.json())

			console.log('existing project saved:', savedTab)

			setUserProjects(
				userProjects.map(p => p['_id'] === saveObj['_id'] ? saveObj : p)
			)

			setActiveProject(saveObj)
		}

		setIsNew(false)
	}

	async function deleteProject(deleteObj) {
		// Delete project folder
		let projectFolder = await fetch(`api/folder`, {
			method: 'DELETE',
			body: JSON.stringify({
				id: deleteObj['folder'],
			})
		}).then(r => r.json())


		let deletedRecord = await fetch(`api/project?id=${deleteObj['_id']}`, {
			method: 'DELETE',
			body: JSON.stringify({ tab: deleteObj })
		}).then(r => r.json())

		console.log('record deleted:', deletedRecord)

		setUserProjects(
			userProjects.filter(t => t['_id'] !== deleteObj['_id'])
		)
		setActiveProject();

		deleteModalHandlers.close();
	}

	async function addTabToProject(project, tabId) {
		let saveObj = project

		// Create shortcut in project folder
		const tab = userTabs.find(t => t['_id'] === tabId)
		const shortcut = await fetch(`api/shortcut`, {
			method: 'PUT',
			body: JSON.stringify({ tab: tab, folder: project['folder'] })
		}).then(r => r.json())

		console.log('shortcut', shortcut)

		saveObj = {
			...saveObj,
			tabIds: [...saveObj['tabIds'], { tabId: tabId, shortcutId: shortcut.data.id }],
			lastUpdatedTime: new Date(),
		}
		// Save project to database
		let savedProject = await fetch(`api/project?id=${saveObj._id}`, {
			method: 'PUT',
			body: JSON.stringify({ record: saveObj })
		}).then(r => r.json())

		setUserProjects(
			userProjects.map(p => p['_id'] === saveObj['_id'] ? saveObj : p)
		)

		setActiveProject(saveObj)
	}

	async function removeTabFromProject(project, tabId) {
		let saveObj = project

		// Delete shortcut in project folder
		const tab = userTabs.find(t => t['_id'] === tabId)
		fetch(`api/shortcut`, {
			method: 'DELETE',
			body: JSON.stringify({ record: { id: saveObj['tabIds'].find(t => t['tabId'] === tabId)['shortcutId'] } })
		}).then(r => r.json())

		saveObj = {
			...saveObj,
			tabIds: saveObj['tabIds'].filter(t => t['tabId'] !== tabId),
			lastUpdatedTime: new Date(),
		}
		// Save project to database
		let savedProject = await fetch(`api/project?id=${saveObj._id}`, {
			method: 'PUT',
			body: JSON.stringify({ record: saveObj })
		}).then(r => r.json())

		setUserProjects(
			userProjects.map(p => p['_id'] === saveObj['_id'] ? saveObj : p)
		)

		setActiveProject(saveObj)
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
					<Group gap={5} justify='flex-start' wrap='nowrap'>
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
									onClick={() => openMenu()}
								>
									Open
								</Menu.Item>
								<Menu.Item
									onClick={() => editMenu()}
									disabled={!activeProject}
								>
									Edit
								</Menu.Item>
								<Menu.Item
									onClick={() => saveMenu()}
									disabled={activeProject === undefined}
								>
									Save
								</Menu.Item>
								<Menu.Item
									color="red"
									onClick={() => deleteMenu()}
									disabled={activeProject === undefined}
								>
									Delete
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>

						<Menu position='bottom-start' shadow="md" color="#4B0082">
							<Menu.Target>
								<Button size='xs'>tabs</Button>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item
									onClick={() => { setPickTabMode('add'); pickTabModalHandlers.open() }}
									disabled={activeProject === undefined}
								>
									Add
								</Menu.Item>
								<Menu.Item
									onClick={() => { setPickTabMode('remove'); pickTabModalHandlers.open() }}
									disabled={activeProject === undefined}
								>
									Remove
								</Menu.Item>

							</Menu.Dropdown>
						</Menu>

						<Menu position='bottom-start' shadow="md" color="#4B0082">
							<Menu.Target>
								<Button size='xs'>social</Button>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item
									onClick={() => updateSpotifyPlaylistMenu()}
									disabled={activeProject === undefined}
								>
									{`${(activeProject?.spotifyPlaylistId ? 'Update' : 'Create')} Spotify playlist`}
								</Menu.Item>
								<Menu.Item
									onClick={() => ('folder' in activeProject) && window.open(`https://drive.google.com/drive/u/0/folders/${activeProject['folder']}`)}
									disabled={activeProject === undefined}
								>
									Open Drive folder
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>

					</Group>
				</AppShell.Section>

				<AppShell.Section h="100%" style={{ overflowY: 'scroll' }}>
					{activeProject && ('tabIds' in activeProject) && activeProject['tabIds'].map(t => {
						const { tabId } = t;
						const tab = userTabs.find(t => t._id === tabId)

						return (
							<NavLink
								key={tab['_id']}
								label={
									<Stack gap={0}>
										<Text fz="14">{tab['songName']}</Text>
										<Text fz="12">{tab['artistName']}</Text>
									</Stack>
								}
								onClick={() => { setActiveTab(tab); }}
								active={activeTab && tab['_id'] === activeTab['_id']}
							/>
						)
					}
					)}
				</AppShell.Section>
			</AppShell.Navbar>

			<AppShell.Main h="100%" >
				<AppShell.Section>
					<Group gap={0} pl={15} pr={15} style={{ borderBottom: '1px solid var(--app-shell-border-color)' }} h="auto">
						<Group flex={1} justify='center'>
							<Text fw="bold">
								{activeProject && `${activeProject?.['name'].replaceAll(/[ ',./]/g, '').toLowerCase()}.proj`}
							</Text>
						</Group>
						{/* <Group ml="auto">
							{activeProject && activeProject['capo'] > 0 && (<Text>capo {activeProject['capo']} </Text>)}
							{activeProject && activeProject['tuning'] && (<Text>{activeProject['tuning']} </Text>)}
						</Group> */}
					</Group>
				</AppShell.Section>

				<AppShell.Section h="100%" grow style={{ overflow: 'none' }}>
					<Editor
						key={activeTab?.['_id']}
						initialText={activeTab?.tabText ?? ""}
						disabled={true}
					// onTextChange={(val) => {
					// editorTextRef.current = val;
					// if (!modified) setModified(true);
					// }}
					/>
				</AppShell.Section>

				<OpenModal
					opened={openModalOpened}
					close={openModalHandlers.close}
					projects={userProjects}
					// object={activeProject}
					submit={(_id) => setActiveProject(userProjects.find(p => p['_id'] === _id))}
				// submit={(val) => console.log(val)}
				// isNew={isNew}
				/>
				<EditModal
					opened={editModalOpened}
					close={editModalHandlers.close}
					object={activeProject}
					submit={saveProject}
					isNew={isNew}
				/>
				<DeleteModal
					opened={deleteModalOpened}
					close={deleteModalHandlers.close}
					object={activeProject}
					submit={deleteProject}
				/>
				<PickTabModal
					opened={pickTabModalOpened}
					close={pickTabModalHandlers.close}
					tabs={pickTabMode === 'add' ?
						userTabs.filter(t => !activeProject?.['tabIds'].map(t => t['tabId']).includes(t['_id'])) :
						pickTabMode === 'remove' ?
							userTabs.filter(t => activeProject?.['tabIds'].map(t => t['tabId']).includes(t['_id'])) :
							[]
					}
					// object={activeProject}
					submit={(_id) => pickTabMode === 'add' ?
						addTabToProject(activeProject, _id) :
						pickTabMode === 'remove' ?
							removeTabFromProject(activeProject, _id) :
							[]
					}
				// deleteProject={deleteProject}

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
	)
}

