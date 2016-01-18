
const _ = require('lodash')

const rollup = require('rollup')
const rollupBabel = require('rollup-plugin-babel')

const Promise = require('bluebird')

const utils = require('./utils')

const fs = Promise.promisifyAll(require('fs-extra'))
const dust = Promise.promisifyAll(require('dustjs-linkedin'))
const glob = Promise.promisify(require('glob'))

const PACKAGE = require('../bower.json')
const TARGET = PACKAGE['build-target']
const GLOBALS = PACKAGE['globals']

function compileTemplate (srcPath, basePath) {
  var name = srcPath
  name = name.replace(`${basePath}/`, '')
  name = name.replace('.dust', '')
  return Promise.resolve()
    .then(() => fs.readFileAsync(srcPath))
    .then((data) => dust.compile(data.toString(), name))
}

function compileTemplates (srcPath, targetPath) {
  return Promise.resolve()
    .then(() => glob(`${srcPath}/**/*.dust`, {}))
    .then(function (files) {
      return Promise.all(files.map(function (filePath) {
        return compileTemplate(filePath, srcPath)
      }))
    })
    .then((result) => {
      result = result.join('')
      result = `import dust from 'dust'\n\n` + result
      return fs.writeFileAsync(targetPath, result)
    })
    .then(() => utils.log(`Compiled templates at '${srcPath}'`))
}

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
    .then(() => compileTemplates('templates', 'src/templates.js'))
    .then(() => packageApplication('src/index.js', TARGET, GLOBALS))
}

module.exports = build

if (!module.parent) {
  build().catch(utils.handleError)
}
