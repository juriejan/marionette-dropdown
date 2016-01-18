
import _ from 'lodash'

function defined () {
  return _.find(arguments, function (o) {
    return (o !== undefined)
  })
}

function transfer (sender, receiver, eventName) {
  sender.listenTo(sender, eventName, function () {
    var args = _([eventName]).concat(arguments).value()
    receiver.trigger.apply(receiver, args)
  })
}

function loadingEvents (receiver, sender) {
  transfer(sender, receiver, 'loading')
  transfer(sender, receiver, 'loaded')
}

function loadingActions (view, inside) {
  view.listenTo(view, 'loading', function () {
    view.$el.loading(true, inside)
  })
  view.listenTo(view, 'loaded', function () {
    view.$el.loading(false, inside)
  })
};

export default {
  defined,
  loadingActions,
  loadingEvents
}
