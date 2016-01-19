
import _ from 'lodash'

import Backbone from 'backbone'
import Marionette from 'marionette'
import Cocktail from 'cocktail'

var originalExtend = Backbone.Model.extend

var extend = function (protoProps, classProps) {
  var klass = originalExtend.call(this, protoProps, classProps)
  var mixins = klass.prototype.mixins
  if (mixins && klass.prototype.hasOwnProperty('mixins')) {
    Cocktail.mixin(klass, mixins)
  }
  return klass
}

_.each([
  Backbone.Model,
  Backbone.Collection,
  Backbone.Router,
  Backbone.View,
  Marionette.ItemView,
  Marionette.CollectionView,
  Marionette.CompositeView,
  Marionette.LayoutView
], function (klass) {
  klass.mixin = function mixin () {
    Cocktail.mixin(this, _.toArray(arguments))
  }
  klass.extend = extend
})
