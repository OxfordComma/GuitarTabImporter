import FullscreenWindow from './FullscreenWindow'

export default function ConfirmDelete ({ 
    show, 
    // tabs, 
    deleteFrom,
    // setTabs, 
    setDeleteFrom,
    // tabId,
    deletedItemId,
    // deleteTab,
    deleteItem,
    // setDeleteTabId,
    // setDeletedItemId,
    close= () => {},
}) {
	let item = deleteFrom.find(i => i.id == deletedItemId) ?? {}

  return (<FullscreenWindow
    show={show}
    action={deleteItem}
    close={close}
    actionLabel='delete'
    content={
      <div>
        <div style={{opacity: 1}}>Are you sure you want to delete {item.name} ({item.id})?</div>
      </div>
    }/>)
}