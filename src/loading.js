
import $ from 'jquery'

import templates from './templates'

const spinnerHtml = templates['spinner']({})

function add (el) {
  var loadingEl = $('<div class="loading"></div>')
  loadingEl.append(spinnerHtml)
  el.append(loadingEl)
}

function remove (el) {
  el.children('.loading').remove()
}

function loading (el, on) {
  if (on) {
    add(el)
  } else {
    remove(el)
  }
}

export default loading
