var webpackConfig = require('./webpack.config')

module.exports = function (karma) {
  karma.set({
    frameworks: ['mocha'],
    reporters: ['spec'],
    files: ['../test/index.js'],
    preprocessors: {
      '../test/index.js': ['webpack', 'sourcemap']
    },
    webpack: webpackConfig,
    webpackMiddleware: {
      noInfo: true
    },
    customLaunchers: {
      'PhantomJS_debug': {
        base: 'PhantomJS',
        debug: true
      }
    },
    port: 80,
    singleRun: false,
  })
}
