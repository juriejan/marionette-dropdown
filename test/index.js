/* global mocha, describe, it */

import {DropdownView} from 'dropdown'
import {expect} from 'chai'

import Marionette from 'marionette'

describe('Marionette Dropdown', function () {
  it('works', function () {
    var view = new DropdownView()
    expect(view).to.exists
  })
})

mocha.run()
