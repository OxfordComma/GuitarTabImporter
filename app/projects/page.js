'use client'
import { TabsContext } from 'components/Context.js'
import { useState, useEffect, useContext } from 'react'
import Header from '@/components/Header';
import { AppShell, Box, Button, Center, Flex, Group, Indicator, Menu, NavLink, NumberInput, Stack, Text, Textarea, Modal, TextInput, Select, Checkbox } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import Editor from '@/components/Editor';


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
						}) ) }
						value={projectId}
						onChange={(value, option) => setProjectId(value)}
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

function EditModal({ opened, close, object: project, submit, isNew }) {
	const form = useForm({
		initialValues: {
			_id: undefined,
			name: ""
		}
	});

	useEffect(() => {
		if (project) {
			form.setValues({
				_id: project?._id ?? undefined,
				name: project?.name ?? ""
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
						}) ) }
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

	const [openModalOpened, openModalHandlers] = useDisclosure();
	const [editModalOpened, editModalHandlers] = useDisclosure();
	const [deleteModalOpened, deleteModalHandlers] = useDisclosure();
	const [pickTabModalOpened, pickTabModalHandlers] = useDisclosure();

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

	async function saveProject(saveObj) {
		saveObj = {
			...saveObj,
			lastUpdatedTime: new Date(),
		}

		console.log('saving project:', saveObj)
		
		if (isNew) {
			// const { ...toSave } = saveObj
			let savedProject = await fetch(`api/project`, {
				method: 'POST',
				body: JSON.stringify({ record: saveObj })
			}).then(r => r.json())

			console.log('new project saved:', savedProject)

			const newProject = {
				'_id': savedProject['insertedId'],
				...saveObj
			}

			setUserProjects(
				[newProject, ...userProjects]
			)
		}
		else {
			let savedTab = await fetch(`api/tab?id=${saveObj['_id']}`, {
				method: 'PUT',
				body: JSON.stringify({ record: saveObj })
			}).then(r => r.json())

			console.log('existing tab saved:', savedTab)

			setUserProjects(
				userProjects.map(p => p['_id'] === saveObj['_id'] ? saveObj : p)
			)
		}

		setIsNew(false)
	}

	async function deleteProject(deleteObj) {
		let deletedRecord = await fetch(`api/project?id=${deleteObj['_id']}`, {
			method: 'DELETE',
			body: JSON.stringify({ tab: deleteObj })
		}).then(r => r.json())

		console.log('record deleted:', deletedRecord)

		setUserProjects(
			userProjects.filter(t => t['_id'] !== deleteObj['_id'])
		)

		deleteModalHandlers.close();
	}

	async function addTabToProject(project, tabId) {
		// let saveObj = project

		// saveObj = {
		// 	...saveObj,
		// 	tabs: [ ...saveObj['tabs'] ?? [], tabId ],
		// 	lastUpdatedTime: new Date(),
		// }

		// let savedProject = await fetch(`api/project?id=${saveObj._id}`, {
		// 	method: 'PUT',
		// 	body: JSON.stringify({ record: saveObj })
		// }).then(r => r.json())

		// setUserProjects(
		// 	userProjects.map(p => p['_id'] === saveObj['_id'] ? saveObj : p)
		// )
		setActiveProject(
			{
				...project, 
				tabIds: [ ...project['tabIds'] ?? [], tabId ],
			}
		)
	}

	async function removeTabFromProject(project, tabId) {
		setActiveProject(
			{
				...project, 
				tabIds: (project['tabIds'] ?? []).filter(t => t !== tabId)
			}
		)
	}

	return (
		<AppShell
			h="100dvh"
			style={{ overflow: 'hidden' }}
			header={{ height: 50 }}
			navbar={{
				width: 300
			}}
		>
			<AppShell.Header>
				<Header />
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
									onClick={() => deleteModalHandlers.open()}
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
									onClick={() => { setPickTabMode('add'); pickTabModalHandlers.open() } }
									// rightSection={Object.keys(sortStatus).length === 0 && (<IconCheck size={12} />)}
									disabled={activeProject === undefined}
								>
									Add
								</Menu.Item>
								<Menu.Item
									onClick={() =>{ setPickTabMode('remove'); pickTabModalHandlers.open() } }
									// rightSection={Object.keys(sortStatus).length === 0 && (<IconCheck size={12} />)}
									disabled={activeProject === undefined}
								>
									Remove
								</Menu.Item>

							</Menu.Dropdown>
						</Menu>

					</Group>
				</AppShell.Section>

				<AppShell.Section h="100%" style={{ overflowY: 'scroll' }}>
					{activeProject && ('tabIds' in activeProject) && activeProject['tabIds'].map(tabId => {
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
						)}
					)}
				</AppShell.Section>
			</AppShell.Navbar>

			<AppShell.Main h="100%" >
				<AppShell.Section>
					<Group gap={0} ml={15} mr={15} h="auto">
						<Group flex={1} justify='center'>
							<Text>
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
						onTextChange={(val) => {
							// editorTextRef.current = val;
							// if (!modified) setModified(true);
						}}
					/>
				</AppShell.Section>

				<OpenModal
					opened={openModalOpened}
					close={openModalHandlers.close}
					projects={userProjects}
					// object={activeProject}
					submit={( _id ) => setActiveProject(userProjects.find(p => p['_id'] === _id))}
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
						userTabs.filter(t => !activeProject?.['tabIds'].includes(t['_id']) ) : 
						pickTabMode === 'remove' ? 
						userTabs.filter(t => activeProject?.['tabIds'].includes(t['_id']) ) :
						[]
					}
					// object={activeProject}
					submit={( _id ) => pickTabMode === 'add' ? 
						addTabToProject(activeProject, _id) : 
						pickTabMode === 'remove' ? 
						removeTabFromProject(activeProject, _id) : 
						[]
					}
					// deleteProject={deleteProject}

				/>
			</AppShell.Main>

			{/* <AppShell.Footer>
				'Footer text'
			</AppShell.Footer> */}
		</AppShell>
	)
}

