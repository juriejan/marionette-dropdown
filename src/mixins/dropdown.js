
import $ from 'jquery'
import _ from 'lodash'

import animation from 'animation'

import utils from '../utils'

export default {
  events: {
    keydown: 'onKeyDown'
  },
  initialize: function (options) {
    this.placeholder = this.placeholder || options.placeholder
    this.allowEmpty = this.allowEmpty || options.allowEmpty
    this.expanded = false
    this.showing = false
    this.hiding = false
    this.name = options.name
    this.parent = options.parent
    if (this.getCollection) {
      this.collection = this.getCollection()
    } else {
      this.collection = options.collection
    }
    this.hideListFunc = _.bind(this.hideList, this, null)
  },
  onRender: function () {
    if (this.expanded) { this.list.$el.css({opacity: 1}) }
    this.scrollParent = this.$el.closest('.nano-content')
  },
  onParentScroll: function (e) {
    this.positionList()
  },
  onDestroy: function () {
    $(window).off('click', this.hideListFunc)
    this.scrollParent.off('scroll', this.hideListFunc)
    this.scrollParent.off('scroll', this.onParentScrollFunc)
    if (this.list) this.list.destroy()
  },
  onKeyDown: function (e) {
    if (this.list && this.list.onKeyDown) this.list.onKeyDown(e)
  },
  onAttach: function () {
    // Create the list view
    this.list = new this.focusListView({
      childView: this.dropdownItemView,
      collection: this.collection,
      scroll: this.options.scroll
    })
    // Attach to list events
    this.listenTo(this.list, 'render:collection', this.onListCollectionRender)
    utils.transferAll(this.list, this, 'list')
    // Render the list before showing
    this.list.render()
    // Set the list width if specified
    if (this.options.listHeight) {
      this.list.$el.css('height', this.options.listHeight)
    }
    // Make list invisible
    animation.visible(this.list.$el, false)
    // Reset the list width
    this.resetListWidth()
    // Move the list element to the indicated overlay
    this.getOverlay().append(this.list.$el)
    // Refresh the list scrolling
    if (this.options.scroll) this.list.refreshScroll()
  },
  onListCollectionRender: function () {
    if (this.options.scroll) this.list.refreshScroll()
  },
  resetListWidth: function () {
    if (this.options.scroll) {
      let width = this.options.listWidth || this.$el.outerWidth()
      this.list.$el.outerWidth(width)
    }
  },
  serializeData: function () {
    return {
      name: this.name,
      placeholder: this.placeholder
    }
  },
  toggleList: function () {
    if (this.expanded) {
      this.hideList()
    } else {
      this.showList()
    }
  },
  positionList: function () {
    let listEl = this.list.$el
    let windowHeight = $(window).height()
    let windowWidth = $(window).width()
    let elOffset = this.$el.offset()
    let elHeight = this.$el.outerHeight()
    let elWidth = this.$el.outerWidth()
    let listWidth = this.list.$el.outerWidth()
    let listHeight = 500
    // let listHeight = this.list.$el.outerHeight()
    let potentialTop = elOffset.top - listHeight
    let potentialBottom = elOffset.top + elHeight + listHeight
    let potentialRight = elOffset.left + listWidth
    let expandedToLeft = (potentialRight > windowWidth)
    let expandedToTop = (potentialBottom > windowHeight) && (potentialTop > 0)
    if (expandedToTop) {
      listEl.css({top: '', bottom: (windowHeight - (elOffset.top + elHeight))})
    } else {
      listEl.css({top: elOffset.top, bottom: ''})
    }
    if (expandedToLeft) {
      listEl.css({right: (windowWidth - (elOffset.left + elWidth))})
    } else {
      listEl.css({left: elOffset.left})
    }
  },
  showList: function () {
    if (!this.showing && !this.hiding &&
      (!this.collection.isEmpty() || this.allowEmpty)) {
      // Add the class indicating open status
      this.$el.addClass('open')
      // Raise the element to maintain visiblity
      this.$el.css('z-index', 2)
      // Attach to the list close event
      this.list.listenTo(this.list, 'close', this.hideList.bind(this))
      // Prevent list from automatically rendering on collection reset
      this.list.stopListening(this.collection, 'reset')
      // Get the list element
      let listEl = this.list.$el
      // Position the list before animation
      this.positionList()
      // Trigger the dropdown show event
      this.trigger('dropdown:show')
      // Attach to event for hiding and scrolling the list on scroll
      this.onParentScrollFunc = this.onParentScroll.bind(this)
      this.scrollParent.on('scroll', this.onParentScrollFunc)
      // Expand and show the list
      this.showing = true
      return animation.show(listEl).then(() => {
        this.showing = false
        this.expanded = true
        // Listen to select events
        this.listenTo(this.list, 'select', this.onItemSelect)
        // Trigger freeze on parent if available
        if (this.parent) { this.parent.trigger('freeze') }
        // Attach to event for hiding the list on click (skip current)
        _.defer(() => {
          $(window).one('click', this.hideListFunc)
          this.scrollParent.one('scroll', this.hideListFunc)
        })
      })
    } else {
      return Promise.resolve()
    }
  },
  hideList: function () {
    if ((!this.hiding && this.expanded) || this.showing) {
      // Remove the class indicating open status
      this.$el.removeClass('open')
      // Remove the item select handler after potential handling
      _.defer(() => this.stopListening(this.list, 'select', this.onItemSelect))
      // Shrink and hide the element
      this.hiding = true
      return animation.hide(this.list.$el).then(() => {
        this.hiding = false
        this.expanded = false
        // Return the element to it's original level
        this.$el.css('z-index', '')
        // Detach the hide from the window click
        $(window).off('click', this.hideListFunc)
        // Detach the hide from the scroll
        this.scrollParent.off('scroll', this.onParentScrollFunc)
        this.scrollParent.off('scroll', this.hideListFunc)
        // Trigger the hidden event
        this.trigger('hidden')
        // Trigger freeze on parent if available
        if (this.parent) { this.parent.trigger('thaw') }
      })
    } else {
      return Promise.resolve()
    }
  }
}
