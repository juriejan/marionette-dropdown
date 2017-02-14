
import _ from 'lodash'

import loading from './loading'

function defined () {
  return _.find(arguments, function (o) {
    return (o !== undefined)
  })
}

function transfer (sender, receiver, eventName) {
  sender.listenTo(sender, eventName, function () {
    let args = _([eventName]).concat(arguments).value()
    receiver.trigger.apply(receiver, args)
  })
}

function transferAll (sender, receiver, originName) {
  sender.listenTo(sender, 'all', function (eventName) {
    let args = _([`${originName}:${eventName}`]).concat(arguments).value()
    receiver.trigger.apply(receiver, args)
  })
}

function loadingEvents (receiver, sender) {
  transfer(sender, receiver, 'loading')
  transfer(sender, receiver, 'loaded')
}

function loadingActions (view) {
  view.listenTo(view, 'loading', () => { loading(view.$el, true) })
  view.listenTo(view, 'loaded', () => { loading(view.$el, false) })
}

export default {
  defined,
  loadingActions,
  loadingEvents,
  transferAll
}
