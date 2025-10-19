const path = require('path')
const { merge } = require('webpack-merge')
const commonConfiguration = require('./webpack.common.js')
const os = require('os')
const portFinderSync = require('portfinder-sync')

const infoColor = (msg) => `\u001b[1m\u001b[34m${msg}\u001b[39m\u001b[22m`

function getLocalIp() {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const isV4 = typeof net.family === 'string' ? net.family === 'IPv4' : net.family === 4
      if (isV4 && !net.internal) return net.address
    }
  }
  return 'localhost'
}

module.exports = merge(commonConfiguration, {
	stats: 'errors-warnings',
	mode: 'development',
	infrastructureLogging: { level: 'warn' },

	devServer: {
		host: 'local-ip',
		port: portFinderSync.getPort(8080),
		open: true,
		server: 'http',
		allowedHosts: 'all',
		hot: false,
		watchFiles: ['src/**', 'src/static/**'],
		// Serve the actual static folder (your current file points to ../static, which doesn't exist)
		static: {
			watch: true,
			directory: path.join(__dirname, '../src/static'),
		},
		client: { logging: 'none', overlay: true, progress: false },
		// Clean URL handling:
		//  - "/"               -> /index.html
		//  - "/about" or "/"   -> /about/index.html
		historyApiFallback: {
			rewrites: [
				{ from: /^\/$/, to: '/index.html' },
				{
					from: /^(?!.*\.).*$/,
					to: (ctx) => {
						const p = ctx.parsedUrl.pathname.replace(/\/$/, '')
						return p ? `${p}/index.html` : '/index.html'
					},
				},
			],
		},

		onListening(devServer) {
			const addr = devServer.server.address()
			const port = typeof addr === 'object' && addr ? addr.port : devServer.options.port
			const protocol = devServer.options.server === 'https' ? 'https' : 'http'
			const localIp = getLocalIp()
			console.log( `Project running at:\n  - ${infoColor(`${protocol}://${localIp}:${port}`)}\n  - ${infoColor(`${protocol}://localhost:${port}`)}`)
		},
	},
})