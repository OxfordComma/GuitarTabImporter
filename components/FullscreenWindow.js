import styles from '../styles/FullscreenWindow.module.css'

export default function FullscreenWindow({ 
    show, 
    content, 
    action=()=>{}, 
    actionLabel='save',
    close=()=>{}
  }) {
  return (show ? <div className={styles['fullscreen-background']}>
    <div className={styles['fullscreen-window']}>
      
      {content}
      
      <div style={{display: 'flex', justifyContent: 'right', height: '25px', 'marginTop': 'auto'}}>
        <label for='action'></label>
        <button name='action' onClick={action}>{actionLabel}</button>

        <label for='action'></label>
        <button name='close' onClick={close}>close</button>
       </div>
    </div>
  </div> : null)
}