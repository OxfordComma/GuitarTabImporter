// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// var nodeExternals = require('webpack-node-externals');

module.exports = [{
	watch: true,
	entry: './js/react/GuitarTabImporter.js',
	module: {
		rules: [
			{
				test: /\.(js)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				}
			}
		]
	},
	resolve: {
		extensions: ['*', '.js']
	},
	output: {
		path: __dirname + '/public/js',
		publicPath: '/',
		filename: 'GuitarTabImporter.js'
	},
	mode: 'development'
}
]