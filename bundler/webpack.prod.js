const { merge } = require('webpack-merge')
const commonConfiguration = require('./webpack.common.js')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const { GenerateSW } = require('workbox-webpack-plugin')
const HTMLInlineCSSWebpackPlugin = require("html-inline-css-webpack-plugin").default
const RobotstxtPlugin = require('robotstxt-webpack-plugin')
const SitemapPlugin = require('sitemap-webpack-plugin').default
const path = require('path')
const fg = require('fast-glob')
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://mina.bahaasamir.me'
const root = path.resolve(__dirname, '..')
const htmlFiles = fg.sync('src/**/*.html', { cwd: root })
const routes = htmlFiles
	.map((f) => path.relative('src', f).replace(/\\/g, '/').replace(/\.html$/, ''))
	.map((noExt) => (noExt === 'index' ? '/' : `/${noExt}/`))
	// optional: drop utility pages
	.filter((r) => r !== '/404/')

module.exports = merge(commonConfiguration, {
	mode: 'production',
	output: {
		clean: true,
	},
	performance: { hints: false },
	optimization: {
		minimize: true,
		minimizer: [new CssMinimizerPlugin(), new TerserPlugin()],
	},
	plugins: [

		new GenerateSW({
			swDest: 'service-worker.js',
			clientsClaim: true,
			skipWaiting: true,
			runtimeCaching: [
				{
					urlPattern: ({ request }) => request.destination === 'document',
					handler: 'NetworkFirst',
					options: {
						cacheName: 'pages',
						networkTimeoutSeconds: 3,
						expiration: { maxEntries: 80, maxAgeSeconds: 7 * 24 * 60 * 60 },
					},
				},
				{
					urlPattern: ({ request, url }) =>
					request.destination === 'image' ||
					url.pathname.startsWith('/images/'),
					handler: 'StaleWhileRevalidate',
						options: {
						cacheName: 'images',
						expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 },
					},
				},
				{
					urlPattern: ({ request, url }) =>
					request.destination === 'video' ||
					url.pathname.startsWith('/videos/'),
					handler: 'CacheFirst',
					options: {
						cacheName: 'videos',
						rangeRequests: true,
						expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
					},
				},
				{
					urlPattern: ({ request, url }) =>
					request.destination === 'font' ||
					url.pathname.startsWith('/fonts/'),
					handler: 'CacheFirst',
					options: {
						cacheName: 'fonts',
						expiration: { maxEntries: 60, maxAgeSeconds: 365 * 24 * 60 * 60 },
					},
				},
				{
					urlPattern: ({ url }) => url.pathname.startsWith('/files/'),
					handler: 'StaleWhileRevalidate',
					options: {
						cacheName: 'files',
						expiration: { maxEntries: 100, maxAgeSeconds: 180 * 24 * 60 * 60 },
					},
				},
			],

			navigateFallbackDenylist: [
				new RegExp('^/(api|admin)(/|$)'),
			],

			ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^barba/],
		}),

		// new HTMLInlineCSSWebpackPlugin(),

		// robots.txt
		new RobotstxtPlugin({
			policy: [
				{ userAgent: '*', allow: '/' },
				// { userAgent: '*', disallow: '/admin/' },
			],
			sitemap: `${SITE_ORIGIN.replace(/\/+$/,'')}/sitemap.xml`,
			host: SITE_ORIGIN.replace(/\/+$/,''),
		}),

		// sitemap.xml
		new SitemapPlugin({
			base: SITE_ORIGIN.replace(/\/+$/,''),
			paths: routes,
			options: {
				changefreq: 'weekly',
				priority: 0.7,
				lastmod: true,
			},
		}),

	],

})