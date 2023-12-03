import FullscreenWindow from './FullscreenWindow'

export default function ConfirmDelete ({ 
    show, 
    tabs, 
    setTabs, 
    tabId,
    deleteTab,
    setDeleteTabId,
    close= () => {},
}) {
	let tab = tabs.find(t => t.id == tabId) ?? {}

  return (<FullscreenWindow
    show={show}
    action={deleteTab}
    close={close}
    actionLabel='delete'
    content={
      <div>
        <div style={{opacity: 1}}>Are you sure you want to delete {tab.name ?? tab.tabName }?</div>
      </div>
    }/>)
}