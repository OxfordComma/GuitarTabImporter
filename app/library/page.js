'use client'
import { useState, useContext, useEffect } from 'react'
import Header from '@/components/Header';
import { TabsContext } from 'components/Context.js'

import { AppShell, Box, Button, Center, Flex, Group, Indicator, Menu, NavLink, Stack, Text, Textarea } from '@mantine/core';
import { sortBy } from 'lodash';


function Editor({ tab, modified, setModified }) {
	// console.log('editor tab:', tab)

	const [editorTab, setEditorTab] = useState(tab);
	
	useEffect(() => {
		if (tab) {
			setEditorTab(tab)
		}
	}, [tab])

	return (<Textarea
		variant='unstyled'
		ml={15} mr={15}
		w="100%"
		// h="100%"
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

		value={editorTab && editorTab['tabText']}
		onChange={(event) => {
			setEditorTab({
				...editorTab, tabText: event.currentTarget.value
			})
			setModified(true)
		}}
		spellCheck={false}
	>

	</Textarea>)
}

export default function Home({
}) {
	let {
		userTabs, setUserTabs
	} = useContext(TabsContext)

	const [tabs, setTabs] = useState([]);
	const [activeTab, setActiveTab] = useState();
	// const [activeTabId, setActiveTabId] = useState();
	const [modified, setModified] = useState(false);
	const [sortStatus, setSortStatus] = useState(false);

	useEffect(() => {
		setTabs(userTabs)
	}, [userTabs]);

	useEffect(() => {
		const sortedTabs = sortBy(userTabs, sortStatus.columnAccessor)
		setTabs(sortStatus.direction === 'desc' ? sortedTabs.reverse() : sortedTabs);
	}, [sortStatus]);

	return (
		<AppShell
			h="100dvh"
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

			<AppShell.Navbar >
				<AppShell.Section>
					<Menu position='bottom-start' shadow="md" color="#4B0082">
						<Menu.Target>
							<Button size='xs'>sort</Button>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Item
							onClick={() => setSortStatus({})}
							>
								None
							</Menu.Item>
							<Menu.Item
								onClick={() => setSortStatus({
									columnAccessor: 'artistName',
									direction: sortStatus?.['direction'] ===  'asc' ? 'desc' :  'asc'
								})}
							>
								Artist
							</Menu.Item>
							<Menu.Item
								onClick={() => setSortStatus({
									columnAccessor: 'songName',
									direction: sortStatus?.['direction'] ===  'asc' ? 'desc' :  'asc'
								})}
							>
								Song
							</Menu.Item>
							<Menu.Item
								onClick={() => setSortStatus({
									columnAccessor: 'createdTime',
									direction: sortStatus?.['direction'] ===  'asc' ? 'desc' :  'asc'
								})}
							>
								Created
							</Menu.Item>
							<Menu.Item
								onClick={() => setSortStatus({
									columnAccessor: 'lastModifiedTime',
									direction: sortStatus?.['direction'] ===  'asc' ? 'desc' :  'asc'
								})}
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
											setTabs(userTabs)
										}}
									>
										all
									</Menu.Item>
									<Menu.Item
										onClick={() => {
											setTabs(userTabs.filter(t => t['capo'] && t['capo'] > 0))
										}}
									>
										yes
									</Menu.Item>
									<Menu.Item
										onClick={() => {
											setTabs(userTabs.filter(t => t['capo'] === 0 || t['capo']))
										}}
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
											setTabs(userTabs)
										}}
									>
										all
									</Menu.Item>
									<Menu.Item
										onClick={() => {
											setTabs(userTabs.filter(t => t['tuning'] && t['tuning'] === 'EADGBe'))
										}}
									>
										Standard
									</Menu.Item>
									<Menu.Item
										onClick={() => {
											setTabs(userTabs.filter(t => t['tuning'] && t['tuning'] === 'EbAbDbGbBbeb'))
										}}
									>
										1/2 Step Down
									</Menu.Item>
									<Menu.Item
										onClick={() => {
											setTabs(userTabs.filter(t => t['tuning'] && t['tuning'] === 'DADGBe'))
										}}
									>
										Drop D
									</Menu.Item>
									<Menu.Item
										onClick={() => {
											setTabs(userTabs.filter(t => t['tuning'] && t['tuning'] === 'DADF#Ad'))
										}}
									>
										DADF#AD
									</Menu.Item>
									<Menu.Item
										onClick={() => {
											setTabs(userTabs.filter(t => t['tuning'] && !['EADGBe', 'EbAbDbGbBbeb', 'DADGBe', 'DADF#Ad'].includes(t['tuning'])))
										}}
									>
										Other
									</Menu.Item>
								</Menu.Sub.Dropdown>
							</Menu.Sub>
						</Menu.Dropdown>
					</Menu>
				</AppShell.Section>

				<AppShell.Section h="100%" style={{ overflowY: 'scroll' }}>
					{tabs.map(tab => (
						<NavLink
							key={tab['_id']}
							label={
								<Indicator offset={5} color='red' disabled={!(activeTab && (tab['_id'] === activeTab['_id']) && modified ) }>
									<Stack gap={0}>
										<Text fz="14">{tab['songName']}</Text>
										<Text fz="12">{tab['artistName']}</Text>
									</Stack>
								</Indicator>
							}
							// leftSection={<IconSettings size={16} stroke={1.5} />}
							onClick={() => { setActiveTab(tab); setModified(false); }}
							active={activeTab && tab['_id'] === activeTab['_id']}
						/>
					))}
				</AppShell.Section>
			</AppShell.Navbar>

			<AppShell.Main h="100%" style={{overflow: 'hidden' }}>
				<AppShell.Section>
					<Group gap={0} ml={15} mr={15} h="auto">
						<Menu position='bottom-start'  shadow="md" color="#4B0082">
							<Menu.Target>
								<Button size='xs'>tab</Button>
							</Menu.Target>

							<Menu.Dropdown>
								<Menu.Item
								// onClick={() => newCollectionMenu()}
								>
									New
								</Menu.Item>
								<Menu.Item
								// onClick={() => newCollectionMenu()}
								>
									Edit
								</Menu.Item>
								<Menu.Item
									// onClick={() => editCollectionMenu()}
									// disabled={activeCollectionId === undefined}
									disabled
								>
									Import
								</Menu.Item>
								<Menu.Item
								// onClick={() => newCollectionMenu()}
								>
									Open in Docs
								</Menu.Item>
								<Menu.Item
									color="red"
									// onClick={() => deleteCollectionModalHandlers.open()}
									disabled={activeTab === undefined}
								>
									Delete
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
						<Menu position='bottom-start'  shadow="md" color="#4B0082">

							<Menu.Target>
								<Button size='xs'>view</Button>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item
								// onClick={() => newCollectionMenu()}
								>
									Toggle two column mode
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
						<Menu position='bottom-start'  shadow="md" color="#4B0082">

							<Menu.Target>
								<Button size='xs'>tools</Button>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item
								// onClick={() => newCollectionMenu()}
								>
									Format 2 chords per line
								</Menu.Item>
								<Menu.Item
								// onClick={() => newCollectionMenu()}
								>
									Format 4 chords per line
								</Menu.Item>
								<Menu.Item
								// onClick={() => newCollectionMenu()}
								>
									Add tab staff
								</Menu.Item>
								<Menu.Item
								// onClick={() => newCollectionMenu()}
								>
									Create chord list
								</Menu.Item>
								<Menu.Item
								// onClick={() => newCollectionMenu()}
								>
									Convert chords to tabs
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
						<Group flex={1} justify='center'>
							<Text>
								{activeTab && `${activeTab['songName'].replaceAll(/ /g, '').toLowerCase()}.${activeTab['artistName'].replaceAll(/ /g, '').toLowerCase()}.tab`}
							</Text>
						</Group>
						<Group  ml="auto">
							{activeTab && activeTab['capo'] > 0 && (<Text>capo {activeTab['capo']} </Text>)}
							{activeTab && activeTab['tuning'] && (<Text>{activeTab['tuning']} </Text>)}
						</Group>
					</Group>
				</AppShell.Section>

				<AppShell.Section h="100%" grow>
					<Editor 
						tab={activeTab} 
						modified={modified}
						setModified={setModified}
						// setTab={(tab) => setUserTabs(
						// 	userTabs.map(t => t['_id'] === tab['_id'] ? tab : t)
						// )} 
					/>
				</AppShell.Section>
			</AppShell.Main>

			{/* <AppShell.Footer>
				'Footer text'
			</AppShell.Footer> */}
		</AppShell>

	);
}
