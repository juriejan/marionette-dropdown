
const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs-extra'))

function log (message) { console.log(message) }

function handleError (err) { log(err.stack || err.message || err) }

function mkdirs (dirname) {
  return fs.mkdirsAsync(dirname).then(() => {
    log(`Created ${dirname} directory`)
  })
}

module.exports = {
  handleError,
  log,
  mkdirs
}
