
import $ from 'jquery'
import _ from 'lodash'

import Marionette from 'marionette'
import {FocusListView} from 'focuslist'

import ItemView from './item'
import DropdownMixin from '../mixins/dropdown'

import utils from '../utils'
import templates from '../templates'

const DropdownFocusListView = FocusListView.extend({
  attributes: {class: 'dropdownList focusList'}
})

export default Marionette.LayoutView.extend({
  mixins: [DropdownMixin],
  template: templates['dropdown'],
  focusListView: DropdownFocusListView,
  dropdownItemView: ItemView,
  attributes: {
    class: 'dropdown'
  },
  ui: {
    button: '.dropdown-button',
    text: '.button-text',
    input: 'input'
  },
  events: {
    'change @ui.input': 'onInputChange',
    'click @ui.button': 'onButtonClick',
    'focus @ui.button': 'onButtonFocus',
    'blur @ui.button': 'onButtonBlur'
  },
  initialize: function (options) {
    this.listenTo(this, 'dropdown:show', this.onDropdownShow)
    utils.loadingEvents(this, this.collection)
    utils.loadingActions(this, true)
  },
  onDropdownShow: function () {
    // Indicate currently selected item with focus
    if (this.selected) {
      let child = this.list.findByModel(this.selected)
      if (child) { child.$el.addClass('focus') }
    }
  },
  onRender: function () {
    this.determineState()
    this.listenTo(this.collection, 'reset', this.determineState)
  },
  onShow: function () {
    if (this.selected) { this.select(this.selected, true) }
  },
  onInputChange: function () {
    let value = this.ui.input.val()
    this.selectId(value)
  },
  onButtonClick: function (e) {
    e.stopPropagation()
    e.preventDefault()
    if (!this.expanded) {
      _.defer(this.showList.bind(this))
    }
  },
  onButtonFocus: function (e) {
    e.stopPropagation()
    e.preventDefault()
    if (!this.expanded) {
      _.defer(this.showList.bind(this))
    }
  },
  onButtonBlur: function (e) {
    if (this.expanded) {
      let focusedView = this.list.findFocusedItem()
      if (focusedView !== undefined) {
        this.list.trigger('select', focusedView)
      }
    } else {
      this.hideList()
    }
  },
  onItemSelect: function (child) {
    this.select(child.model, true)
    this.hideList()
  },
  getOverlay: function () {
    return $('body')
  },
  getFirst: function () {
    let visible = this.collection.filter(function (o) {
      return !(o.get('visible') === false)
    })
    return _.first(visible)
  },
  getSelected: function () {
    return this.selected
  },
  getListWidth: function () {
    let el = this.ui.text
    let text = el.text()
    let width = 0
    el.css({visibility: 'hidden'})
    this.collection.each((model) => {
      el.text(model.get('text'))
      if (el.width() > width) width = el.width()
    })
    el.html(text)
    el.css('visibility', '')
    return width
  },
  determineState: function () {
    this.disabled = (this.collection.size() === 0)
    if (this.disabled) {
      this.$el.addClass('disabled')
      this.ui.button.attr('tabindex', -1)
      this.select(null)
    } else {
      this.$el.removeClass('disabled')
      this.ui.button.attr('tabindex', 0)
      if (this.selectedId) {
        this.select(this.collection.get(this.selectedId))
        this.selectedId = null
      } else {
        let id = this.ui.input.val() || (this.selected && this.selected.id)
        this.select(this.collection.get(id) || this.getFirst())
      }
    }
  },
  select: function (model, trigger) {
    let changed = !(this.selected === model)
    this.selected = model
    if (this.isRendered) {
      if (this.selected) {
        this.ui.text.html(this.selected.get('text'))
        this.ui.input.val(this.selected.id)
      } else {
        this.ui.text.html('---')
        this.ui.input.val('')
      }
      if (trigger) { this.ui.input.trigger('change') }
    }
    if (changed) { this.trigger('select', this.selected) }
  },
  selectId: function (id, trigger) {
    if (id === undefined || id === null || _.size(id) === 0) {
      this.select(this.getFirst(), trigger)
    } else {
      let item = this.collection.get(id)
      if (!item) {
        this.selectedId = id
      } else {
        this.select(this.collection.get(id), trigger)
      }
    }
  },
  refresh: function () {
    this.ui.text.css('min-width', this.getListWidth())
  },
  setVisibleOptions: function (visible) {
    // Set the visibility of each model in the collection
    this.collection.each(function (model) {
      model.set('visible', _.includes(visible, model.id))
    })
    // Determine if the selection should be changed
    if (this.selected) {
      if (this.selected.get('visible') === false) {
        this.select(this.getFirst())
      }
    }
    // Re-render the list and refresh calculations
    this.refresh()
  }
})
