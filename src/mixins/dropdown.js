
import $ from 'jquery'
import _ from 'lodash'

import animation from '../animation'

import FocusListView from './views/focusList'

export default {
  regions: {
    list: 'div.dropdown-list'
  },
  ui: {
    list: 'div.dropdown-list'
  },
  events: {
    'keydown': 'onKeyDown'
  },
  preserveListWidth: false,
  initialize: function (options) {
    this.maxSize = options.maxSize
    this.expanded = false
    this.animating = false
    this.name = options.name
    this.parent = options.parent
    if (this.getCollection) {
      this.collection = this.getCollection()
    } else {
      this.collection = options.collection
    }
  },
  onRender: function () {
    this.list = new FocusListView({
      maxSize: this.maxSize,
      childView: this.dropdownItemView,
      collection: this.collection,
      attributes: {class: 'dropdownList focusList'}
    })
    this.listenTo(this.list, 'select', this.onItemSelect)
    if (this.expanded) { this.list.$el.css({opacity: 1}) }
  },
  onShow: function () {
    this.getRegion('list').show(this.list)
    this.scrollParent = this.$el.closest('.nano-content')
    animation.flat(this.list.$el)
    // Customize reset render for the focus list
    this.list.stopListening(this.collection, 'reset')
    this.listenTo(this.collection, 'reset', this.onCollectionReset)
  },
  onCollectionReset: function () {
    if (this.expanded) {
      this.hideList(function () {
        this.list.render()
        this.showList()
      }.bind(this))
    } else {
      this.list.render()
    }
  },
  onKeyDown: function (e) {
    this.list.onKeyDown(e)
  },
  onParentScroll: function (e) {
    this.positionList()
  },
  onDestroy: function () {
    $(window).off('click', this.hideListFunc)
    this.scrollParent.off('scroll', this.hideListFunc)
    this.scrollParent.off('scroll', this.onParentScrollFunc)
  },
  serializeData: function () {
    return {name: this.name}
  },
  setSelection: function (id) {
    this.list.children.each(function (child) {
      if (child.model.id === id) {
        this.onItemSelect(child)
      }
    }.bind(this))
  },
  getSelection: function () {
    return this.selected
  },
  toggleList: function () {
    if (this.expanded) {
      this.hideList()
    } else {
      this.showList()
    }
  },
  positionList: function () {
    var listEl = this.list.$el
    var windowHeight = $(window).height()
    var elOffset = this.$el.offset()
    var elHeight = this.$el.outerHeight()
    if (this.isExpandedToTop) {
      listEl.css({top: '', bottom: (windowHeight - elOffset.top)})
    } else {
      listEl.css({top: (elOffset.top + elHeight), bottom: ''})
    }
    listEl.css('left', elOffset.left)
  },
  showList: function () {
    if (!this.animating && !this.collection.isEmpty()) {
      var listEl = this.list.$el
      // Apply parent styles
      listEl.css(this.$el.css(['font-size', 'line-height']))
      // Move the list element to the page body
      listEl.appendTo($('body'))
      // Determine the height of the list
      this.listHeight = this.list.getListHeight()
      // Set the list width
      if (this.preserveListWidth) {
        this.listWidth = this.list.getListWidth()
      } else {
        this.listWidth = this.$el.outerWidth()
      }
      // Apply list width
      listEl.outerWidth(this.listWidth)
      // Decide which way to expand the list
      var elOffset = this.$el.offset()
      var windowHeight = $(window).height()
      var elHeight = this.$el.outerHeight()
      var potentialTop = elOffset.top - this.listHeight
      var potentialBottom = elOffset.top + elHeight + this.listHeight
      this.isExpandedToTop = (potentialBottom > windowHeight) && (potentialTop > 0)
      this.positionList()
      // Trigger the dropdown show event
      this.trigger('dropdown:show')
      // Expand and show the list
      this.animating = true
      animation.grow(listEl, 'height', this.listHeight, function () {
        this.animating = false
        this.expanded = true
        this.list.refreshScroll()
        // Trigger freeze on parent if available
        if (this.parent) { this.parent.trigger('freeze') }
      }.bind(this))
      // Attach to event for hiding and scrolling the list on scroll
      this.onParentScrollFunc = this.onParentScroll.bind(this)
      this.scrollParent.on('scroll', this.onParentScrollFunc)
      // Attach to event for hiding the list on click (skip current)
      _.defer(function () {
        this.hideListFunc = _.bind(this.hideList, this, null)
        $(window).one('click', this.hideListFunc)
        this.scrollParent.one('scroll', this.hideListFunc)
      }.bind(this))
    }
  },
  hideList: function (done) {
    var listEl = this.list.$el
    // Shrink and hide the element
    this.animating = true
    animation.shrink(listEl, 'height', function () {
      this.animating = false
      this.expanded = false
      // Move the list element back to the view
      listEl.appendTo(this.ui.list)
      // Recover the list height
      listEl.height(this.listHeight)
      // Recover the list width
      listEl.css('width', '')
      // Remove focus from all items
      listEl.children().removeClass('focus')
      // Detach from the scroll and hiding events
      $(window).off('click', this.hideListFunc)
      this.scrollParent.off('scroll', this.onParentScrollFunc)
      this.scrollParent.off('scroll', this.hideListFunc)
      // Call the completed callback
      if (done) { done() }
      // Trigger the hidden event
      this.trigger('hidden')
      // Trigger freeze on parent if available
      if (this.parent) { this.parent.trigger('thaw') }
    }.bind(this))
  }
}
