import React from 'react'
import Header from '../components/Header.js'

import styles from '../styles/profile.module.css'
import { useSession } from "next-auth/react"
import { useState, useEffect } from 'react'
import useDrivePicker from 'react-google-drive-picker'
import GooglePicker from 'react-google-picker'

export default function Profile(props) {
  const { data: session, status } = useSession()

  let [folder, setFolder] = useState('')
  let [url, setUrl] = useState('')
  let [token, setToken] = useState(null)
  
  
  let [googleDocs, setGoogleDocs] = useState([])


  useEffect(async () => {
  	async function updateFolder() {
  		let user = await fetch('/api/user').then(r => r.json())
	  	console.log('user:', user)
  		let account = await fetch('/api/account?userid='+user._id).then(r => r.json())
	  	console.log('account:', account)

	  // 	let folderContents = await fetch('/api/folder?folder=' + user.folder).then(r => r.json())
	  // 	console.log(folderContents)
			setFolder(user.folder)
			setToken(account.access_token)
			// setGoogleDocs(folderContents)
  	}

  	updateFolder();


  	
  	
	}, [])

  useEffect(() => {
  	console.log('gapi:', window.gapi)
  	console.log('google:', window.google)

  	window.gapi?.client?.init({
	    'apiKey': 'AIzaSyDR3bJrfjXh2EC4Hclvf0r2NRcSbyJQxlU',
	    // clientId and scope are optional if auth is not required.
	    'clientId': '296193245260-prmltutuorpem0knakev0t4q1m709srh.apps.googleusercontent.com',
	    'scope': 'profile',
	  })
  })

  useEffect(() => console.log('token:', token), [token])
  
  let onSubmit = async function(event, folder, url) {
  	event.preventDefault()
  	let userUpdate = await fetch('/api/user?folder='+folder, { method: 'POST' }).then(r => r.json())
  	console.log(userUpdate)

  	// let response = await fetch('/api/create?folder='+folder+'&url='+url).then(r => r.json())
  	// console.log(response)
  	// setGoogleDocs(googleDocs.concat([response]))
  	// setGoogleDocsUrls(googleDocsUrls.concat(response.googleUrl))
  	// setSongName([response.artist, response.songName].join(' - '))
  }
  // let [pickerInited, setPickerInited] = useState(false)
  const [openPicker, authResponse] = useDrivePicker();  

  // React.useEffect(() => {
	// 	console.log('auth res:', authResponse)
	// 	return null
  // }, [authResponse])
  // // const customViewsArray = [new google.picker.DocsView()]; // custom view
  // const handleOpenPicker = () => {
  //   openPicker({
  //     clientId: "296193245260-prmltutuorpem0knakev0t4q1m709srh.apps.googleusercontent.com",
  //     developerKey: "AIzaSyDR3bJrfjXh2EC4Hclvf0r2NRcSbyJQxlU",
  //     viewId: "FOLDERS",
  //     token: token, // pass oauth token in case you already have one
  //     // showUploadView: true,
  //     // showUploadFolders: true,
  //     // supportDrives: true,
  //     // multiselect: true,
  //     // customViews: customViewsArray, // custom view
  //     callbackFunction: (data) => {
  //       if (data.action === 'cancel') {
  //         console.log('User clicked cancel/close button')
  //       }
  //       console.log(data)
  //     },
  //   })
  // }

  // function gapiLoaded() {
  // 	console.log('gapi')
  //   gapi.load('client:picker', initializePicker);
  // }

  // async function initializePicker() {
  //   await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
  //   setPickerInited(true)
  //   // maybeEnableButtons();
  // }

	return (
		<div className={styles.container}>
			<script async src="https://apis.google.com/js/api.js" onload="gapiLoaded()"></script>

				<form className={styles.column} onSubmit={e => onSubmit(e, folder, url)}>
					<span>
						<input type="submit" hidden/>
						<label htmlFor="url">Folder:</label>
						<input type="text" name="folder" id="folder" required="required" autocomplete="off" value={folder} onChange={e => setFolder(e.target.value)}/>
					</span>
					<span>
						{/*<button type='submit'>submit</button>*/}
						
						{/*<GooglePicker clientId={'296193245260-prmltutuorpem0knakev0t4q1m709srh.apps.googleusercontent.com'}
              developerKey={'AIzaSyDR3bJrfjXh2EC4Hclvf0r2NRcSbyJQxlU'}
              scope={['https://www.googleapis.com/auth/drive.readonly']}
              onChange={data => console.log('on change:', data)}
              onAuthFailed={data => console.log('on auth failed:', data)}
              // multiselect={true}
              // navHidden={true}
              // authImmediate={false}
              mimeTypes={['image/png', 'image/jpeg', 'image/jpg']}
              // query={'a query string like .txt or fileName'}
              viewId={'DOCS'}>
            >
							<span>Click</span>
            	<div className="google"></div>*/}
							<button type='button' onClick={() => {
								console.log('clicky')
						    const googleViewId = google.picker.ViewId['DOCS'];

						    const view = new window.google.picker.View(googleViewId);

				   		  const picker = new window.google.picker.PickerBuilder()
                   .addView(view)
                   .setOAuthToken(token)
                   .setDeveloperKey('AIzaSyDR3bJrfjXh2EC4Hclvf0r2NRcSbyJQxlU')
                   .setAppId('296193245260-prmltutuorpem0knakev0t4q1m709srh.apps.googleusercontent.com')
                   .setCallback((data) => console.log('set callback', data));

                 picker.build()
          				.setVisible(true);
							}}> google pick</button>
						{/*</GooglePicker>*/}
					</span>
				</form>
			
		</div>)
}

