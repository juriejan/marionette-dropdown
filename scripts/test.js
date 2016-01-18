
const EventEmitter = require('events')

const _ = require('lodash')

const jsdom = require('jsdom')
const wiredep = require('wiredep')
const rollup = require('rollup')

const Promise = require('bluebird')
const SpecReporter = require('mocha/lib/reporters/spec')

const utils = require('./utils')

const PACKAGE = require('../bower.json')
const TARGET = PACKAGE['build-target']

function setup (src) {
  var reportEmitter = new EventEmitter()
  var reporter = new SpecReporter(reportEmitter)
  // Setup the scripts to load
  var scripts = wiredep({devDependencies: true}).js
  scripts = scripts.concat(['test/setup.js', TARGET])
  // Create virtual console
  var virtualConsole = jsdom.createVirtualConsole()
  // Setup virtual console to handle jsdom errors
  virtualConsole.on('jsdomError', function (err) {
    utils.log(err.detail ? err.detail.stack : err.stack)
  })
  // Setup virtual console to handle repoter events
  virtualConsole.on('log', function () {
    if (arguments[0] === 'report') {
      reportEmitter.emit(arguments[1], ...(_.slice(arguments[2])))
    } else {
      utils.log.apply(this, arguments)
    }
  })
  // Setup promise for creating environment
  return new Promise(function (resolve, reject) {
    jsdom.env({
      src,
      scripts,
      virtualConsole,
      html: '',
      done: function (err, window) {
        if (err) return reject(err)
        if (reporter) reporter = null
        resolve(window)
      }
    })
  })
}

function packageTests () {
  var globals = _.extend({}, PACKAGE['globals'], PACKAGE['test-globals'])
  return Promise.resolve()
    .then(() => rollup.rollup({
      entry: 'test/index.js',
      external: _.keys(globals)
    }))
    .then((bundle) => bundle.generate({format: 'umd', globals}))
    .then((result) => result.code)
}

function test () {
  return Promise.resolve()
    .then(() => packageTests())
    .then((code) => setup(code))
}

module.exports = test

if (!module.parent) {
  test().catch(utils.handleError)
}
