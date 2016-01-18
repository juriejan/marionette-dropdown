/* global mocha, describe, it */

import {expect} from 'chai'
import {DropdownView, DropdownMixin} from 'dropdown'

describe('Marionette Dropdown', function () {
  it('view can be created', function () {
    var view = new DropdownView()
    expect(view).to.exists
  })
  it('mixin is exported', function () {
    expect(DropdownMixin).to.exists
  })
})

mocha.run()
