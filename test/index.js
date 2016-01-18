/* global mocha, describe, it */

import {expect} from 'chai'
import {DropdownView, DropdownMixin} from 'dropdown'

import Backbone from 'backbone'

describe('Marionette Dropdown', function () {
  it('view can be created', function () {
    var collection = new Backbone.Collection()
    var view = new DropdownView({collection})
    expect(view).to.exists
  })
  it('mixin is exported', function () {
    expect(DropdownMixin).to.exists
  })
})

mocha.run()
