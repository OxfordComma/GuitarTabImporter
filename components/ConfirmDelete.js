import FullscreenWindow from './FullscreenWindow'

export default function ConfirmDelete ({ 
    show, 
    item,
    action,
    label,
    close= () => {},
    keyFunction = d => d.id,
}) {
  return (item ? <FullscreenWindow
    show={show}
    action={action}
    close={close}
    actionLabel={label}
    content={
      <div>
        <div style={{opacity: 1}}>Are you sure you want to delete {item.name} ({keyFunction(item)})?</div>
      </div>
    }/> : null)
}