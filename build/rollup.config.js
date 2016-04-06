var babel = require('rollup-plugin-babel')
var commonjs = require('rollup-plugin-commonjs')
var npm = require('rollup-plugin-node-resolve')

module.exports = {
  entry: './src/index.js',
  plugins: [
    npm({
      jsnext: true,
      main: true,
    }),
    commonjs({
      include: ['node_modules/**'],
    }),
    babel({
      babelrc: false,
      presets: ["es2015-rollup", "stage-1"],
      exclude: ['node_modules/**'],
    }),
  ],
}
