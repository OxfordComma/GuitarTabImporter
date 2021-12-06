import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import ErrorBoundary from './ErrorBoundary.js'
import Header from './Header.js'
// import Picker from './GooglePicker.js'
import 'regenerator-runtime/runtime'
// import useDrivePicker from 'react-google-drive-picker'



class GuitarTabImporter extends React.Component {

	constructor(props) {
		super(props);
		console.log(props)


		this.state = {
			// user: {
				name: '',
				folder: '/'
			// }
		};		
	}

	

	async componentDidMount() {
		var result = await fetch('/import/user')
		var user = await result.json()
		// console.log(user)

		this.setState({
			name: user.email,
			folder: user.folder
		})
	}

	componentDidUpdate() {
		console.log(this.state)

	}
	

	render() {
		return (
			<div id='container'> 
				<Header options={[ this.state.name ]}/>
				<div id="form">
					<form action='/import/tab' target="_blank">
						<label htmlFor="url">Tab URL:</label>
						<input type="text" name="url" id="url" required="required" autocomplete="off" autofocus/>
						<input type="submit" hidden/>
						<label htmlFor="url">Folder:</label>
						<input type="text" name="folder" id="folder" required="required" autocomplete="off" autofocus value={this.state.folder}/>
					</form>
				</div>
				
			</div>


		)
	}
}



// Render application
ReactDOM.render(
	<ErrorBoundary>
		<GuitarTabImporter />
	</ErrorBoundary>,
	document.getElementById('root')
);


