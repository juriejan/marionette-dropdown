
import $ from 'jquery'
import _ from 'lodash'

import animation from 'animation'

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
    this.list = new this.focusListView({
      maxSize: this.maxSize,
      childView: this.dropdownItemView,
      collection: this.collection
    })
    this.listenTo(this.list, 'select', this.onItemSelect)
    this.getRegion('list').show(this.list)
    // Determine the scroll parent
    this.scrollParent = this.$el.closest('.nano-content')
    // Flatten the list element
    animation.flat(this.list.$el)
    // Customize reset render for the focus list
    this.list.stopListening(this.collection, 'reset')
    this.listenTo(this.collection, 'reset', this.onCollectionReset)
  },
  onAttach: function () {
    // Apply parent styles
    this.list.$el.css(this.$el.css(['font-size', 'line-height']))
    // Reset the list width
    this.resetListWidth()
    // Move the list element to the page body
    this.list.$el.appendTo($('body'))
  },
  onCollectionReset: function () {
    this.stopListening(this.list, 'select', this.onItemSelect)
    if (this.expanded) {
      this.hideList(() => this.renderAndShowList())
    } else {
      this.renderAndShowList()
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
  renderAndShowList: function () {
    this.list.render()
    return this.showList(() => {
      this.listenTo(this.list, 'select', this.onItemSelect)
    })
  },
  setSelection: function (id) {
    this.list.children.each((child) => {
      if (child.model.id === id) {
        this.onItemSelect(child)
      }
    })
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
  resetListWidth: function () {
    this.list.$el.outerWidth(this.$el.outerWidth())
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
  showList: function (done) {
    if (!this.showing && !this.hiding && !this.collection.isEmpty()) {
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
        // Call the completed callback
        if (done) { done() }
        // Trigger freeze on parent if available
        if (this.parent) { this.parent.trigger('freeze') }
      })
    }
  },
  hideList: function (done) {
    if (!this.hiding) {
      var listEl = this.list.$el
      // Shrink and hide the element
      this.hiding = true
      return animation.shrink(listEl, 'height').then(() => {
        this.hiding = false
        this.expanded = false
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
      })
    }
  }
}
