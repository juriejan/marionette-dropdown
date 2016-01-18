(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('lodash'), require('marionette'), require('jquery'), require('dust')) :
  typeof define === 'function' && define.amd ? define(['lodash', 'marionette', 'jquery', 'dust'], factory) :
  (global.dropdown = factory(global._,global.Marionette,global.$,global.dust));
}(this, function (_,Marionette,$,dust) { 'use strict';

  _ = 'default' in _ ? _['default'] : _;
  Marionette = 'default' in Marionette ? Marionette['default'] : Marionette;
  $ = 'default' in $ ? $['default'] : $;
  dust = 'default' in dust ? dust['default'] : dust;

  var ItemView = Marionette.ItemView.extend({
    tagName: 'li',
    template: '{{text}}',
    events: {
      mouseover: 'onMouseOver'
    },
    triggers: {
      click: 'select'
    },
    onMouseOver: function onMouseOver() {
      this.trigger('focus');
    },
    attributes: function attributes() {
      return { 'data-value': this.model.id };
    }
  });

  var getOriginal = function getOriginal(el, name) {
    var current = el.css(name);
    el.css(name, '');
    var original = el.css(name);
    el.css(name, current);
    return original;
  };

  var determineSize = function determineSize(el, side) {
    if (side === 'top' || side === 'bottom') {
      return parseInt(el.css('height'), 10);
    } else if (side === 'left' || side === 'right') {
      return parseInt(el.css('width'), 10);
    }
  };

  var animation = {
    show: function show(el, done) {
      el.velocity({ opacity: 1 }, {
        easing: 'easeInOutCubic',
        duration: 'fast',
        complete: done,
        visibility: 'visible',
        queue: false
      });
    },
    hide: function hide(el, done) {
      el.velocity({ opacity: 0 }, {
        easing: 'easeInOutCubic',
        duration: 'fast',
        complete: done,
        visibility: 'hidden',
        queue: false
      });
    },
    slideOut: function slideOut(el, side, done, progress) {
      var margin = 'margin-' + side;
      var properties = { opacity: 1 };
      var size = determineSize(el, side);
      // Set the initial css properties
      el.css(margin, '-' + size + 'px');
      el.css('display', '');
      // Animate to the new properties
      properties[margin] = 0;
      el.velocity(properties, {
        easing: 'easeInOutCubic',
        progress: progress,
        complete: done
      });
    },
    slideIn: function slideIn(el, side, done, progress) {
      var margin = 'margin-' + side;
      var properties = { opacity: 0 };
      var size = determineSize(el, side);
      // Animate to the new properties
      properties[margin] = '-' + size + 'px';
      el.velocity(properties, {
        easing: 'easeInOutCubic',
        progress: progress,
        complete: done
      });
    },
    flexGrow: function flexGrow(el, basis, show, done) {
      var final = { 'flex-grow': '1' };
      if (show) {
        final.opacity = 1;
      }
      if (basis) {
        final['flex-basis'] = basis + 'px';
      }
      el.velocity(final, { easing: 'easeInOutCubic', complete: done });
    },
    flexShrink: function flexShrink(el, basis, hide, done) {
      var final = { 'flex-grow': '.0001' };
      if (hide) {
        final.opacity = 0;
      }
      if (basis) {
        final['flex-basis'] = basis + 'px';
      }
      el.velocity(final, { easing: 'easeInOutCubic', complete: done });
    },
    grow: function grow(el, dimension, size, done) {
      // Set the initial styles
      var initial = { opacity: 0 };
      initial[dimension] = 0;
      el.css(initial);
      // Animate the grow
      var final = { opacity: 1 };
      // Determine the size to grow to
      if (size) {
        final[dimension] = size;
      } else {
        final[dimension] = getOriginal(el, dimension);
      }
      // Detemrine the original margins
      if (dimension === 'width') {
        final['margin-left'] = getOriginal(el, 'margin-left');
        final['margin-right'] = getOriginal(el, 'margin-right');
        final['padding-right'] = getOriginal(el, 'padding-right');
        final['padding-left'] = getOriginal(el, 'padding-left');
      } else {
        final['margin-top'] = getOriginal(el, 'margin-top');
        final['margin-bottom'] = getOriginal(el, 'margin-bottom');
        final['padding-top'] = getOriginal(el, 'padding-top');
        final['padding-bottom'] = getOriginal(el, 'padding-bottom');
      }
      // Initiate animation
      el.velocity(final, {
        easing: 'easeInOutCubic',
        display: '',
        queue: false,
        complete: done
      });
    },
    shrink: function shrink(el, dimension, done) {
      var final = { opacity: 0 };
      final[dimension] = 0;
      // Set the appropriate margins to zero
      if (dimension === 'width') {
        final['margin-left'] = 0;
        final['margin-right'] = 0;
        final['padding-left'] = 0;
        final['padding-right'] = 0;
      } else {
        final['margin-top'] = 0;
        final['margin-bottom'] = 0;
        final['padding-top'] = 0;
        final['padding-bottom'] = 0;
      }
      // Initiate animation
      el.velocity(final, {
        easing: 'easeInOutCubic',
        display: '',
        queue: false,
        complete: done
      });
    },
    toggleIcon: function toggleIcon(onIcon, offIcon, status, animate) {
      if (animate) {
        if (status) {
          onIcon.velocity({ opacity: 0 }, { easing: 'easeInOutCubic' });
          offIcon.velocity({ opacity: 1 }, { easing: 'easeInOutCubic' });
        } else {
          onIcon.velocity({ opacity: 1 }, { easing: 'easeInOutCubic' });
          offIcon.velocity({ opacity: 0 }, { easing: 'easeInOutCubic' });
        }
      } else {
        if (status) {
          onIcon.css({ opacity: 0 });
          offIcon.css({ opacity: 1 });
        } else {
          onIcon.css({ opacity: 1 });
          offIcon.css({ opacity: 0 });
        }
      }
    },
    showRegion: function showRegion(region, view, done) {
      region.show(view);
      this.show(region.$el, done);
    },
    hideRegion: function hideRegion(region, done) {
      if (region.hasView()) {
        this.hide(region.$el, function () {
          region.reset();
          if (done) {
            done();
          }
        });
      } else {
        if (done) {
          done();
        }
      }
    },
    scroll: function scroll(el, container) {
      el.velocity('scroll', {
        axis: 'y',
        duration: 'fast',
        easing: 'easeInOutCubic',
        container: container
      });
    },
    thin: function thin(el) {
      el.css({
        opacity: 0,
        width: 0,
        'margin-left': 0,
        'margin-right': 0,
        'padding-left': 0,
        'padding-right': 0
      });
    },
    flat: function flat(el) {
      el.css({
        opacity: 0,
        height: 0,
        'margin-top': 0,
        'margin-bottom': 0,
        'padding-top': 0,
        'padding-bottom': 0
      });
    },
    original: function original(el) {
      el.css({
        opacity: '',
        visibility: '',
        height: '',
        width: '',
        'margin-top': '',
        'margin-bottom': '',
        'margin-left': '',
        'margin-right': '',
        'padding-top': '',
        'padding-bottom': '',
        'padding-left': '',
        'padding-right': ''
      });
    },
    in: function _in(el, side) {
      var margin = 'margin-' + side;
      var properties = { opacity: 0 };
      var size = determineSize(el, side);
      // Set the element css
      properties[margin] = '-' + size + 'px';
      el.css(properties);
    },
    visible: function visible(el, state) {
      if (state) {
        el.css({ opacity: 1, visibility: 'visible' });
      } else {
        el.css({ opacity: 0, visibility: 'hidden' });
      }
    }
  };

  var FocusListView = Marionette.CompositeView.extend({
    template: 'dropdown.focusList',
    attributes: {
      class: 'focusList'
    },
    events: {
      'keydown': 'onKeyDown'
    },
    childViewContainer: 'ul',
    childEvents: {
      focus: 'onChildFocus',
      select: 'onChildSelect'
    },
    ui: {
      scroll: '.nano',
      content: '.nano-content',
      list: 'ul'
    },
    keyEvents: {
      13: 'itemSelect',
      32: 'itemSelect',
      38: 'onArrowUpKey',
      40: 'onArrowDownKey'
    },
    initialize: function initialize(options) {
      this.maxSize = options.maxSize;
    },
    onShow: function onShow() {
      this.refreshScroll();
    },
    onChildFocus: function onChildFocus(child) {
      if (child.$el.is(':not(.disabled)')) {
        this.ui.list.children().removeClass('focus');
        child.$el.addClass('focus');
      }
    },
    onChildSelect: function onChildSelect(child) {
      this.trigger('select', child);
    },
    onKeyDown: function onKeyDown(e) {
      var method = this.keyEvents[e.keyCode];
      if (method !== undefined) {
        this[method]();
        e.preventDefault();
      }
    },
    onArrowUpKey: function onArrowUpKey() {
      var focusedView = this.findFocusedItem();
      if (focusedView === undefined) {
        this.ui.list.children().last().addClass('focus');
      } else {
        var items = this.ui.list.children(':not(.disabled)');
        var index = items.index(focusedView.el);
        index = index - 1;
        index = index < 0 ? items.length - 1 : index;
        this.focusItem(items, index);
      }
    },
    onArrowDownKey: function onArrowDownKey() {
      var focusedView = this.findFocusedItem();
      if (focusedView === undefined) {
        this.ui.list.children().first().addClass('focus');
      } else {
        var items = this.ui.list.children(':not(.disabled)');
        var index = items.index(focusedView.el);
        index = index + 1;
        index = index > items.length - 1 ? 0 : index;
        this.focusItem(items, index);
      }
    },
    focusItem: function focusItem(items, index) {
      var item = items.eq(index);
      items.removeClass('focus');
      item.addClass('focus');
      animation.scroll(item, this.ui.content);
    },
    filter: function filter(child) {
      return !(child.get('visible') === false);
    },
    itemSelect: function itemSelect(e) {
      var focusedView = this.findFocusedItem();
      this.ui.list.children().removeClass('focus');
      if (focusedView !== undefined) {
        this.trigger('select', focusedView);
      }
    },
    findFocusedItem: function findFocusedItem() {
      return this.children.find(function (child) {
        return child.$el.hasClass('focus');
      });
    },
    refreshScroll: function refreshScroll() {
      this.ui.scroll.nanoScroller({ alwaysVisible: true });
    },
    getListHeight: function getListHeight() {
      var el = this.ui.list;
      var height = el.height();
      el.css('height', '');
      // Calculate the height according to the maximum size
      if (this.maxSize) {
        var firstItem = el.find('li').eq(0);
        var itemHeight = firstItem.outerHeight();
        height = _.min([el.height(), itemHeight * this.maxSize]);
      }
      // Add the top and bottom border widths
      var topWidth = parseInt(this.$el.css('border-top-width'), 10);
      var bottomWidth = parseInt(this.$el.css('border-top-width'), 10);
      height += topWidth + bottomWidth;
      // Return the calculated height
      return height;
    },
    getListWidth: function getListWidth() {
      var width = null;
      this.ui.content.css({ position: 'relative' });
      width = this.$el.outerWidth();
      this.ui.content.css({ position: 'absolute' });
      return width;
    }
  });

  var DropdownMixin = {
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
    initialize: function initialize(options) {
      this.maxSize = options.maxSize;
      this.expanded = false;
      this.animating = false;
      this.name = options.name;
      this.parent = options.parent;
      if (this.getCollection) {
        this.collection = this.getCollection();
      } else {
        this.collection = options.collection;
      }
    },
    onRender: function onRender() {
      this.list = new FocusListView({
        maxSize: this.maxSize,
        childView: this.dropdownItemView,
        collection: this.collection,
        attributes: { class: 'dropdownList focusList' }
      });
      this.listenTo(this.list, 'select', this.onItemSelect);
      if (this.expanded) {
        this.list.$el.css({ opacity: 1 });
      }
    },
    onShow: function onShow() {
      this.getRegion('list').show(this.list);
      this.scrollParent = this.$el.closest('.nano-content');
      animation.flat(this.list.$el);
      // Customize reset render for the focus list
      this.list.stopListening(this.collection, 'reset');
      this.listenTo(this.collection, 'reset', this.onCollectionReset);
    },
    onCollectionReset: function onCollectionReset() {
      if (this.expanded) {
        this.hideList(function () {
          this.list.render();
          this.showList();
        }.bind(this));
      } else {
        this.list.render();
      }
    },
    onKeyDown: function onKeyDown(e) {
      this.list.onKeyDown(e);
    },
    onParentScroll: function onParentScroll(e) {
      this.positionList();
    },
    onDestroy: function onDestroy() {
      $(window).off('click', this.hideListFunc);
      this.scrollParent.off('scroll', this.hideListFunc);
      this.scrollParent.off('scroll', this.onParentScrollFunc);
    },
    serializeData: function serializeData() {
      return { name: this.name };
    },
    setSelection: function setSelection(id) {
      this.list.children.each(function (child) {
        if (child.model.id === id) {
          this.onItemSelect(child);
        }
      }.bind(this));
    },
    getSelection: function getSelection() {
      return this.selected;
    },
    toggleList: function toggleList() {
      if (this.expanded) {
        this.hideList();
      } else {
        this.showList();
      }
    },
    positionList: function positionList() {
      var listEl = this.list.$el;
      var windowHeight = $(window).height();
      var elOffset = this.$el.offset();
      var elHeight = this.$el.outerHeight();
      if (this.isExpandedToTop) {
        listEl.css({ top: '', bottom: windowHeight - elOffset.top });
      } else {
        listEl.css({ top: elOffset.top + elHeight, bottom: '' });
      }
      listEl.css('left', elOffset.left);
    },
    showList: function showList() {
      if (!this.animating && !this.collection.isEmpty()) {
        var listEl = this.list.$el;
        // Apply parent styles
        listEl.css(this.$el.css(['font-size', 'line-height']));
        // Move the list element to the page body
        listEl.appendTo($('body'));
        // Determine the height of the list
        this.listHeight = this.list.getListHeight();
        // Set the list width
        if (this.preserveListWidth) {
          this.listWidth = this.list.getListWidth();
        } else {
          this.listWidth = this.$el.outerWidth();
        }
        // Apply list width
        listEl.outerWidth(this.listWidth);
        // Decide which way to expand the list
        var elOffset = this.$el.offset();
        var windowHeight = $(window).height();
        var elHeight = this.$el.outerHeight();
        var potentialTop = elOffset.top - this.listHeight;
        var potentialBottom = elOffset.top + elHeight + this.listHeight;
        this.isExpandedToTop = potentialBottom > windowHeight && potentialTop > 0;
        this.positionList();
        // Trigger the dropdown show event
        this.trigger('dropdown:show');
        // Expand and show the list
        this.animating = true;
        animation.grow(listEl, 'height', this.listHeight, function () {
          this.animating = false;
          this.expanded = true;
          this.list.refreshScroll();
          // Trigger freeze on parent if available
          if (this.parent) {
            this.parent.trigger('freeze');
          }
        }.bind(this));
        // Attach to event for hiding and scrolling the list on scroll
        this.onParentScrollFunc = this.onParentScroll.bind(this);
        this.scrollParent.on('scroll', this.onParentScrollFunc);
        // Attach to event for hiding the list on click (skip current)
        _.defer(function () {
          this.hideListFunc = _.bind(this.hideList, this, null);
          $(window).one('click', this.hideListFunc);
          this.scrollParent.one('scroll', this.hideListFunc);
        }.bind(this));
      }
    },
    hideList: function hideList(done) {
      var listEl = this.list.$el;
      // Shrink and hide the element
      this.animating = true;
      animation.shrink(listEl, 'height', function () {
        this.animating = false;
        this.expanded = false;
        // Move the list element back to the view
        listEl.appendTo(this.ui.list);
        // Recover the list height
        listEl.height(this.listHeight);
        // Recover the list width
        listEl.css('width', '');
        // Remove focus from all items
        listEl.children().removeClass('focus');
        // Detach from the scroll and hiding events
        $(window).off('click', this.hideListFunc);
        this.scrollParent.off('scroll', this.onParentScrollFunc);
        this.scrollParent.off('scroll', this.hideListFunc);
        // Call the completed callback
        if (done) {
          done();
        }
        // Trigger the hidden event
        this.trigger('hidden');
        // Trigger freeze on parent if available
        if (this.parent) {
          this.parent.trigger('thaw');
        }
      }.bind(this));
    }
  };

  function defined() {
    return _.find(arguments, function (o) {
      return o !== undefined;
    });
  }

  function transfer(sender, receiver, eventName) {
    sender.listenTo(sender, eventName, function () {
      var args = _([eventName]).concat(arguments).value();
      receiver.trigger.apply(receiver, args);
    });
  }

  function loadingEvents(receiver, sender) {
    transfer(sender, receiver, 'loading');
    transfer(sender, receiver, 'loaded');
  }

  function loadingActions(view, inside) {
    view.listenTo(view, 'loading', function () {
      view.$el.loading(true, inside);
    });
    view.listenTo(view, 'loaded', function () {
      view.$el.loading(false, inside);
    });
  };

  var utils = {
    defined: defined,
    loadingActions: loadingActions,
    loadingEvents: loadingEvents
  };

  var DropdownView = Marionette.LayoutView.extend({
    mixins: [DropdownMixin],
    template: 'dropdown.dropdown',
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
    initialize: function initialize(options) {
      this.sizeToContents = utils.defined(options.sizeToContents, true);
      this.listenTo(this, 'dropdown:show', this.onDropdownShow);
      utils.loadingEvents(this, this.collection);
      utils.loadingActions(this, true);
    },
    onDropdownShow: function onDropdownShow() {
      // Remove focus from all items
      this.list.ui.list.children().removeClass('focus');
      // Indicate currently selected item with focus
      if (this.selected) {
        var child = this.list.children.findByModel(this.selected);
        if (child) {
          child.$el.addClass('focus');
        }
      }
    },
    onRender: function onRender() {
      this.determineState();
      this.listenTo(this.collection, 'reset', this.determineState);
      if (this.sizeToContents) {
        this.listenTo(this.collection, 'reset', this.refresh);
      }
    },
    onShow: function onShow() {
      if (this.selected) {
        this.select(this.selected, true);
      }
    },
    onInputChange: function onInputChange() {
      var value = this.ui.input.val();
      this.selectId(value);
    },
    onButtonClick: function onButtonClick(e) {
      if (!this.expanded) {
        _.defer(this.showList.bind(this));
      }
    },
    onItemSelect: function onItemSelect(child) {
      this.select(child.model, true);
      this.hideList();
    },
    getFirst: function getFirst() {
      var visible = this.collection.filter(function (o) {
        return !(o.get('visible') === false);
      });
      return _.first(visible);
    },
    determineState: function determineState() {
      this.disabled = this.collection.size() === 0;
      if (this.disabled) {
        this.$el.addClass('disabled');
        this.select(null);
      } else {
        this.$el.removeClass('disabled');
        var id = this.ui.input.val() || this.selected && this.selected.id;
        this.select(this.collection.get(id) || this.getFirst());
      }
    },
    select: function select(model, trigger) {
      var changed = !(this.selected === model);
      this.selected = model;
      if (this.isRendered) {
        if (this.selected) {
          this.ui.text.html(this.selected.get('text'));
          this.ui.input.val(this.selected.id);
        } else {
          this.ui.text.html('---');
          this.ui.input.val('');
        }
        if (trigger) {
          this.ui.input.trigger('change');
        }
      }
      if (changed) {
        this.trigger('select', this.selected);
      }
    },
    selectId: function selectId(id, trigger) {
      if (id === undefined || id === null || _.size(id) === 0) {
        this.select(this.getFirst(), trigger);
      } else {
        this.select(this.collection.get(id), trigger);
      }
    },
    refresh: function refresh() {
      var el = this.ui.text;
      var oldText = el.text();
      var minWidth = 0;
      el.css({ visibility: 'hidden' });
      this.collection.each(function (model) {
        el.text(model.get('text'));
        if (el.width() > minWidth) {
          minWidth = el.width();
        }
      });
      el.css({ visibility: '', 'min-width': minWidth });
      el.html(oldText);
    },
    setVisibleOptions: function setVisibleOptions(visible) {
      // Set the visibility of each model in the collection
      this.collection.each(function (model) {
        model.set('visible', _.includes(visible, model.id));
      });
      // Determine if the selection should be changed
      if (this.selected) {
        if (this.selected.get('visible') === false) {
          this.select(this.getFirst());
        }
      }
      // Re-render the list and refresh calculations
      this.list.render();
      this.refresh();
    }
  });

  (function (dust) {
    dust.register("dropdown.dropdown", body_0);function body_0(chk, ctx) {
      return chk.w("<button type=\"button\"><div class=\"dropdown-text\"></div><i class=\"icon-expand\" /></button><input type=\"hidden\"").x(ctx.get(["name"], false), ctx, { "block": body_1 }, {}).w(" /><div class=\"dropdown-list invisible shrinkable\"></div>");
    }body_0.__dustBody = !0;function body_1(chk, ctx) {
      return chk.w(" name=\"").f(ctx.get(["name"], false), ctx, "h").w("\"");
    }body_1.__dustBody = !0;return body_0;
  })(dust);(function (dust) {
    dust.register("dropdown.focusList", body_0);function body_0(chk, ctx) {
      return chk.w("<div class=\"nano\"><div class=\"nano-content\"><ul></ul></div></div>");
    }body_0.__dustBody = !0;return body_0;
  })(dust);

  var index = {
    DropdownView: DropdownView,
    DropdownMixin: DropdownMixin
  };

  return index;

}));
//# sourceMappingURL=dist/js/marionette-dropdown.js.map