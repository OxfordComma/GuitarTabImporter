import { useState, useEffect } from 'react'
import useDrivePicker from 'react-google-drive-picker'
import { useSession } from "next-auth/react"
// const {google} = require('googleapis');

// import { useSession } from "next-auth/react"


export async function handleOpenPicker(account, openPicker, onPick, viewId="FOLDERS", parent) {
  console.log('picker account', account, process.env.GOOGLE_APP_ID)
  // await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');

  // const customViewsArray = [
  //   new google.picker.DocsView(),
  //   // new google.picker.FolderView()
  // ]; 
  openPicker({
    appId: account.app_id,
    clientId: account.client_id,
    developerKey: account.api_key,
    viewId: viewId,
    token: account.access_token, // pass oauth token in case you already have one
    setParentFolder: parent ?? 'root',
    setSelectFolderEnabled: true,
    setIncludeFolders: true,
    // showUploadView: true,
    // showUploadFolders: true,
    // supportDrives: true,
    multiselect: true,
    // customViews: customViewsArray, // custom view
    customScopes: ['https://www.googleapis.com/auth/drive.file'],
    callbackFunction: (data) => {
      console.log('picker data', data)
      // if (!data) return;
      if (data.action === 'cancel') {
        console.log('User clicked cancel/close button')
        return;
      }
      if (data.action === 'loaded') {
        console.log('opened picker')
        return;
      }
      if (data.action === 'picked') {
        // console.log(data, data.docs[0])
        let selected = data.docs[0]
        console.log('file picked', selected['id'])
        onPick(selected['id'])
      }
    },
  })
}


export function PickerButton({ account, onPick, label='pick', viewId="FOLDERS", parent }) {
  // const session = useSession()
  const [openPicker, authResponse] = useDrivePicker();
  const session = useSession();
  console.log('picker session', session)
  let [refresh, setRefresh] = useState(false)

  useEffect(() => { 
    async function refreshToken() {
      if (!refresh) return;
      handleOpenPicker(account, openPicker, onPick, viewId, parent)
      setRefresh(false)

    }

    refreshToken()

  }, [refresh])

	return (
    <div style={{textWrap: 'nowrap'}}>
  		<button
      	onClick={e => {
          // handleOpenPicker({...account, ...accountResponse}, openPicker, onPick)
          setRefresh(true)
        }}
      >
      	{label}
      </button>
      </div>
	)
}