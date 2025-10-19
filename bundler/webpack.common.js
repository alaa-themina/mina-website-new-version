// bundler/webpack.common.js
const path = require('path');
const fs = require('fs');
const fg = require('fast-glob');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const root = path.resolve(__dirname, '..');
const SRC  = (...p) => path.resolve(root, 'src', ...p);
const isProd    = process.env.NODE_ENV === 'production';
const isHtmlMin = process.env.HTML_MINIFY === 'true' || isProd;

class AddHeadLinksPlugin {
  constructor({ faviconPath, canonicalBase }) {
    this.faviconPath = faviconPath;
    this.canonicalBase = canonicalBase;
  }
  apply(compiler) {
    compiler.hooks.compilation.tap('AddHeadLinksPlugin', (compilation) => {
      const hooks = HtmlWebpackPlugin.getHooks(compilation);
      hooks.beforeEmit.tap('AddHeadLinksPlugin', (data) => {
        // 1) Favicon
        if (!/rel=["']icon["']/.test(data.html)) {
          const tag = `<link rel="icon" href="${this.faviconPath}">`;
          data.html = data.html.replace(/<\/head>/i, `  ${tag}</head>`);
        }
        // 2) Canonical (prod only)
        const prod = compiler.options.mode === 'production';
        const base = this.canonicalBase || process.env.SITE_ORIGIN;
        if (prod && base && !/rel=["']canonical["']/.test(data.html)) {
          const out = data.outputName || data.plugin?.options?.filename || 'index.html';
          const dir = path.dirname(out);
          let route = dir === '.' ? '/' : `/${dir}/`;
          route = route.replace(/\/+$/, '/');
          const href = `${String(base).replace(/\/+$/,'')}${route}`;
          const tag = `<link rel="canonical" href="${href}">`;
          data.html = data.html.replace(/<\/head>/i, `  ${tag}</head>`);
        }
        return data;
      });
    });
  }
}

// Loads all JSON files under src/_data into a nested object.
// Example: src/_data/courses/webgl.json  =>  data.courses.webgl
function loadDataTree(dirAbs) {
  const files = fg.sync('**/*.json', { cwd: dirAbs, dot: false });
  const tree = {};
  for (const rel of files) {
    const abs = path.join(dirAbs, rel);
    try {
      const json = JSON.parse(fs.readFileSync(abs, 'utf8'));
      const keys = rel.replace(/\.json$/, '').split(/[\\/]/g);
      let cur = tree;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = cur[keys[i]] || {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = json;
    } catch (e) {
      console.error('Invalid JSON:', abs, e.message);
    }
  }
  return tree;
}
const data = loadDataTree(SRC('_data')); // <— global data object

/* ----------------------------  Discover pages  ----------------------------- */
const pageFiles = fg.sync(['src/pages/**/*.njk'], { cwd: root });

const htmlPlugins = pageFiles.map((file) => {
  const abs = path.resolve(root, file);
  const rel = path.relative('src/pages', file);       // e.g., "index.njk" or "series/index.njk"
  const nameNoExt = rel.replace(/\.njk$/, '');
  const outName = nameNoExt === 'index' ? 'index.html' : `${nameNoExt}/index.html`;

  return new HtmlWebpackPlugin({
    template: abs,
    filename: outName,
    inject: 'body',
    minify: isHtmlMin,
    // Function form ensures fresh values in watch mode
    templateParameters: () => ({ data }),
  });
});

/* --------------------------------- Export --------------------------------- */
module.exports = {
  entry: { main: SRC('static/js/script.js') },
  output: { filename: 'app.js', path: path.resolve(root, 'dist'), clean: true },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: SRC('static/images'), to: 'images', noErrorOnMissing: true },
        { from: SRC('static/videos'), to: 'videos', noErrorOnMissing: true },
        { from: SRC('static/files'),  to: 'files',  noErrorOnMissing: true },
        { from: SRC('static/fonts'),  to: 'fonts',  noErrorOnMissing: true },
        { from: SRC('static/css'),    to: 'css/', noErrorOnMissing: true },
      ],
    }),
    new AddHeadLinksPlugin({
      faviconPath: '/images/favicon-32x32.png',
      canonicalBase: process.env.SITE_ORIGIN, // set in prod env, or leave undefined
    }),
    new MiniCssExtractPlugin({ filename: 'app.css' }),
    ...htmlPlugins,

  ],
  module: {
    rules: [
      {
        test: /\.njk$/,
        use: [
          { loader: 'html-loader', options: { minimize: isHtmlMin, sources: false } },
          {
            loader: 'nunjucks-html-loader',
            options: {
              searchPaths: [ SRC('') ],
              noCache: !isProd,
              context: { data },
            },
          },
        ],
      },
      { test: /\.js$/, exclude: /node_modules/, use: ['babel-loader'] },
      { test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] },
    ],
  },
};
