import { useState, useEffect } from 'react'
import useDrivePicker from 'react-google-drive-picker'
import { useSession } from "next-auth/react"

// import { useSession } from "next-auth/react"

function handleOpenPicker(account, openPicker, onPick) {
  console.log('picker account', account)
  openPicker({
    clientId: account.client_id,
    developerKey: account.api_key,
    viewId: "FOLDERS",
    token: account.access_token, // pass oauth token in case you already have one
    setParentFolder: 'root',
    setSelectFolderEnabled: true,
    // showUploadView: true,
    // showUploadFolders: true,
    // supportDrives: true,
    // multiselect: true,
    // customViews: customViewsArray, // custom view
    customScopes: ['https://www.googleapis.com/auth/drive.file'],
    callbackFunction: (data) => {
      // if (!data) return;
      if (data.action === 'cancel') {
        console.log('User clicked cancel/close button')
      }
      console.log(data, data.docs[0])
      let selected = data.docs[0]
      onPick(selected['id'])
    },
  })
}


export default function PickerButton({ account, onPick }) {
  // const session = useSession()
  const [openPicker, authResponse] = useDrivePicker();
  const session = useSession();
  console.log('picker session', session)
  let [refresh, setRefresh] = useState(false)

  useEffect(() => { 
    async function refreshToken() {

      if (!refresh) return;

      
      let accountResponse = await fetch(`/api/account?id=${session.data.user_id}`).then(r => r.json())
      console.log('refresh?', accountResponse)
      if (accountResponse && new Date(accountResponse.expires_at * 1000) < new Date()) {
        console.log('refresh', accountResponse)

        let refreshResponse = await fetch(`https://www.googleapis.com/oauth2/v4/token`, {
          method: 'POST',
          body: JSON.stringify({
            client_id: session.data.client_id,
            client_secret: session.data.client_secret,
            refresh_token: accountResponse.refresh_token,
            grant_type: 'refresh_token',
          })
        }).then(r => r.json())
        console.log('refreshResponse', refreshResponse)
        let expiresAt = new Date()
        expiresAt.setSeconds(expiresAt.getSeconds() + refreshResponse.expires_in)

        fetch(`/api/account?id=${session.data.user_id}`, {
          method: 'POST',
          body: JSON.stringify({
            userId: accountResponse.userId,
            access_token: refreshResponse.access_token,
            expires_at: parseInt(expiresAt.valueOf() / 1000),
          })
        })
      }
      handleOpenPicker(account, openPicker, onPick)
      setRefresh(false)

    }

    refreshToken()

  }, [refresh])

	return (
    <div style={{textWrap: 'nowrap'}}>
  		<button
      	onClick={e => {
          setRefresh(true)
        }}
      >
      	pick folder
      </button>
      </div>
	)
}