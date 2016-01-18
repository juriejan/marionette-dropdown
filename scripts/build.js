
const _ = require('lodash')

const rollup = require('rollup')
const rollupBabel = require('rollup-plugin-babel')

const Promise = require('bluebird')

const utils = require('./utils')

const fs = Promise.promisifyAll(require('fs-extra'))

const PACKAGE = require('../package.json')
const TARGET = PACKAGE['build-target']
const GLOBALS = PACKAGE['global-dependencies']

function packageApplication (entry, dest, globals) {
  return Promise.resolve()
    .then(() => rollup.rollup({
      entry,
      external: _.keys(globals),
      plugins: [rollupBabel()]
    }))
    .then((bundle) => bundle.generate({
      dest,
      globals,
      format: 'umd',
      moduleName: 'dropdown'
    }))
    .then((result) => {
      var mapFileName = `${TARGET}.map`
      var code = result.code + `\n//# sourceMappingURL=${mapFileName}`
      return Promise.all([
        fs.writeFileAsync(TARGET, code),
        fs.writeFileAsync(mapFileName, result.map)
      ])
    })
    .then(() => utils.log(`Packaged application at '${entry}'`))
}

function build () {
  return Promise.resolve()
    .then(() => utils.mkdirs('dist'))
    .then(() => utils.mkdirs('dist/js'))
    .then(() => packageApplication('src/index.js', TARGET, GLOBALS))
}

module.exports = build

if (!module.parent) {
  build().catch(utils.handleError)
}
