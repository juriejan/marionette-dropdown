
import _ from 'lodash'

import Marionette from 'marionette'

import ItemView from './item'
import FocusListView from './focusList'
import DropdownMixin from '../mixins/dropdown'

import utils from '../utils'

const DropdownFocusListView = FocusListView.extend({
  attributes: {class: 'dropdownList focusList'}
})

export default Marionette.LayoutView.extend({
  mixins: [DropdownMixin],
  template: 'dropdown.dropdown',
  focusListView: DropdownFocusListView,
  dropdownItemView: ItemView,
  attributes: {
    class: 'dropdown'
  },
  ui: {
    button: 'button',
    text: '.dropdown-text',
    input: 'input'
  },
  events: {
    'change @ui.input': 'onInputChange',
    'click @ui.button': 'onButtonClick'
  },
  initialize: function (options) {
    this.sizeToContents = utils.defined(options.sizeToContents, true)
    this.listenTo(this, 'dropdown:show', this.onDropdownShow)
    utils.loadingEvents(this, this.collection)
    utils.loadingActions(this, true)
  },
  onDropdownShow: function () {
    // Remove focus from all items
    this.list.ui.list.children().removeClass('focus')
    // Indicate currently selected item with focus
    if (this.selected) {
      var child = this.list.children.findByModel(this.selected)
      if (child) { child.$el.addClass('focus') }
    }
  },
  onRender: function () {
    this.determineState()
    this.listenTo(this.collection, 'reset', this.determineState)
    if (this.sizeToContents) {
      this.listenTo(this.collection, 'reset', this.refresh)
    }
  },
  onShow: function () {
    if (this.selected) { this.select(this.selected, true) }
  },
  onInputChange: function () {
    var value = this.ui.input.val()
    this.selectId(value)
  },
  onButtonClick: function (e) {
    if (!this.expanded) {
      _.defer(this.showList.bind(this))
    }
  },
  onItemSelect: function (child) {
    this.select(child.model, true)
    this.hideList()
  },
  getFirst: function () {
    var visible = this.collection.filter(function (o) {
      return !(o.get('visible') === false)
    })
    return _.first(visible)
  },
  determineState: function () {
    this.disabled = (this.collection.size() === 0)
    if (this.disabled) {
      this.$el.addClass('disabled')
      this.select(null)
    } else {
      this.$el.removeClass('disabled')
      var id = this.ui.input.val() || (this.selected && this.selected.id)
      this.select(this.collection.get(id) || this.getFirst())
    }
  },
  select: function (model, trigger) {
    var changed = !(this.selected === model)
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
      this.select(this.collection.get(id), trigger)
    }
  },
  refresh: function () {
    var el = this.ui.text
    var oldText = el.text()
    var minWidth = 0
    el.css({visibility: 'hidden'})
    this.collection.each(function (model) {
      el.text(model.get('text'))
      if (el.width() > minWidth) {
        minWidth = el.width()
      }
    })
    el.css({visibility: '', 'min-width': minWidth})
    el.html(oldText)
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
    this.list.render()
    this.refresh()
  }
})
