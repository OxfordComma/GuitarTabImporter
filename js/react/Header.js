import React from 'react'

class Header extends React.Component {
	constructor(props) {
		super(props);
	}

	componentDidMount() {
		this.update();
	}
	componentDidUpdate() {
		this.update();
	}

	update() {

	}

	render() {
		return (
			<div className='header'>
				{this.props.options.map(opt => {
					console.log(typeof opt)
					if (typeof opt == 'string') {
						return <div>{opt}</div>
					}
					else
						return <div></div>
				})}
			</div>
		)
	}
}



export default Header