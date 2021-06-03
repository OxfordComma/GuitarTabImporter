import React from 'react'
import ReactDOM from 'react-dom'
import ErrorBoundary from './ErrorBoundary.js'
import 'regenerator-runtime/runtime'


class GuitarTabImporter extends React.Component {
	constructor(props) {
		super(props);
		
		
		
		this.state = {
			
		};

		
	}

	

	async componentDidMount() {
		// var dataUrl = "/data/cars/porsche/all/normalized"
		// var data = await d3.json(dataUrl)
		// var modelUrl = '/data/cars/porsche/model'
		// var model = await d3.json(modelUrl)

		// var outputs = model[0].LinearRegression.outputs

		// data = data.map(d => {
		// 	d.selected = true;
		// 	d.outputDiff = parseInt(d[outputs[0]]) - parseInt(d['^'+outputs[0]])
		// 	d.outputDiffPercent = 100 * (d.outputDiff / d[outputs[0]])
		// 	return d
		// })

		// var rawData = data

		// var sidebar = this.state.sidebar
		// Object.keys(sidebar).map(s => {
		// 	if (sidebar[s] == 'all')
		// 		return
		// 	else
		// 		data = data.filter(d => d[s]?.toString() == sidebar[s])
		// })

		// this.updateOptions(data)

		// this.setState({ 
		// 	data: data,
		// 	rawData: rawData,
		// 	machineLearningModel: model[0],
		// })
	}

	componentDidUpdate() {
		// this.updateOptions(this.state.data)
	}

	

	

	render() {
		// if (this.state.data.length == 0) return null;


		return (

			<div id="form">
	      <form action='/tab'>
	        <label htmlFor="url">
	          <span>Tab URL:
	        		<input type="text" name="url" id="url" required="required" autocomplete="off" autofocus/>
	        		<input type="submit" hidden/>
	        	</span>
        	</label>
        </form>
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


