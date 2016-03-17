
import $ from 'jquery'
import _ from 'lodash'

import animation from 'animation'

export default {
  events: {
    keydown: 'onKeyDown'
  },
  initialize: function (options) {
    this.maxSize = options.maxSize
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
  },
  onRender: function () {
    if (this.expanded) { this.list.$el.css({opacity: 1}) }
  },
  onBeforeShow: function () {
    this.scrollParent = this.$el.closest('.nano-content')
  },
  onParentScroll: function (e) {
    this.positionList()
  },
  onDestroy: function () {
    $(window).off('click', this.hideListFunc)
    this.scrollParent.off('scroll', this.hideListFunc)
    this.scrollParent.off('scroll', this.onParentScrollFunc)
  },
  onKeyDown: function (e) {
    if (this.list && this.list.onKeyDown) this.list.onKeyDown(e)
  },
  serializeData: function () {
    return {name: this.name}
  },
  toggleList: function () {
    if (this.expanded) {
      this.hideList()
    } else {
      this.showList()
    }
  },
  resetListWidth: function () {
    if (this.list && this.list.$el) {
      this.list.$el.outerWidth(this.$el.outerWidth())
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
    if (!this.showing && !this.hiding && !this.collection.isEmpty()) {
      // Create the lost view
      this.list = new this.focusListView({
        maxSize: this.maxSize,
        childView: this.dropdownItemView,
        collection: this.collection
      })
      // Flatten the list element
      animation.flat(this.list.$el)
      // Prevent list from automatically rendering on collection reset
      this.list.stopListening(this.collection, 'reset')
      // Render the list before showing
      this.list.render()
      // Apply parent styles
      this.list.$el.css(this.$el.css(['font-size', 'line-height']))
      // Reset the list width
      this.resetListWidth()
      // Move the list element to the indicated overlay
      this.getOverlay().append(this.list.$el)
      // Get the list element
      var listEl = this.list.$el
      // Reset the list height
      this.list.resetHeight()
      var listHeight = listEl.height()
      // Decide which way to expand the list
      var elOffset = this.$el.offset()
      var windowHeight = $(window).height()
      var elHeight = this.$el.outerHeight()
      var potentialTop = elOffset.top - listHeight
      var potentialBottom = elOffset.top + elHeight + listHeight
      this.isExpandedToTop = (potentialBottom > windowHeight) && (potentialTop > 0)
      // Position the list before animation
      this.positionList()
      // Trigger the dropdown show event
      this.trigger('dropdown:show')
      // Attach to event for hiding and scrolling the list on scroll
      this.onParentScrollFunc = this.onParentScroll.bind(this)
      this.scrollParent.on('scroll', this.onParentScrollFunc)
      // Attach to event for hiding the list on click (skip current)
      _.defer(() => {
        this.hideListFunc = _.bind(this.hideList, this, null)
        $(window).one('click', this.hideListFunc)
        this.scrollParent.one('scroll', this.hideListFunc)
      })
      // Expand and show the list
      this.showing = true
      return animation.grow(listEl, 'height', listHeight).then(() => {
        this.showing = false
        this.expanded = true
        this.list.refreshScroll()
        // Listen to select events
        this.listenTo(this.list, 'select', this.onItemSelect)
        // Trigger freeze on parent if available
        if (this.parent) { this.parent.trigger('freeze') }
      })
    } else {
      return Promise.resolve()
    }
  },
  hideList: function () {
    if ((!this.hiding && this.expanded) || this.showing) {
      // Remove the item select handler after potential handling
      _.defer(() => this.stopListening(this.list, 'select', this.onItemSelect))
      // Shrink and hide the element
      this.hiding = true
      return animation.shrink(this.list.$el, 'height').then(() => {
        this.hiding = false
        this.expanded = false
        // Destory the list
        this.list.destroy()
        // Detach from the scroll and hiding events
        $(window).off('click', this.hideListFunc)
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
