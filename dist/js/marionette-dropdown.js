(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('lodash'), require('backbone'), require('marionette'), require('cocktail'), require('dust'), require('jquery'), require('animation')) :
  typeof define === 'function' && define.amd ? define(['lodash', 'backbone', 'marionette', 'cocktail', 'dust', 'jquery', 'animation'], factory) :
  (global.dropdown = factory(global._,global.Backbone,global.Marionette,global.Cocktail,global.dust,global.$,global.animation));
}(this, function (_,Backbone,Marionette,Cocktail,dust,$,animation) { 'use strict';

  _ = 'default' in _ ? _['default'] : _;
  Backbone = 'default' in Backbone ? Backbone['default'] : Backbone;
  Marionette = 'default' in Marionette ? Marionette['default'] : Marionette;
  Cocktail = 'default' in Cocktail ? Cocktail['default'] : Cocktail;
  dust = 'default' in dust ? dust['default'] : dust;
  $ = 'default' in $ ? $['default'] : $;
  animation = 'default' in animation ? animation['default'] : animation;

  var originalExtend = Backbone.Model.extend;

  var extend = function extend(protoProps, classProps) {
    var klass = originalExtend.call(this, protoProps, classProps);
    var mixins = klass.prototype.mixins;
    if (mixins && klass.prototype.hasOwnProperty('mixins')) {
      Cocktail.mixin(klass, mixins);
    }
    return klass;
  };

  _.each([Backbone.Model, Backbone.Collection, Backbone.Router, Backbone.View, Marionette.ItemView, Marionette.CollectionView, Marionette.CompositeView, Marionette.LayoutView], function (klass) {
    klass.mixin = function mixin() {
      Cocktail.mixin(this, _.toArray(arguments));
    };
    klass.extend = extend;
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
  })(dust);(function (dust) {
    dust.register("dropdown.item", body_0);function body_0(chk, ctx) {
      return chk.f(ctx.get(["text"], false), ctx, "h");
    }body_0.__dustBody = !0;return body_0;
  })(dust);

  var ItemView = Marionette.ItemView.extend({
    tagName: 'li',
    template: 'dropdown.item',
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
      this.list = new this.focusListView({
        maxSize: this.maxSize,
        childView: this.dropdownItemView,
        collection: this.collection
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
        // Determine the height of the list
        this.listHeight = this.list.getListHeight();
        // Set the list width
        if (this.preserveListWidth) {
          this.listWidth = this.list.getListWidth();
        } else {
          this.listWidth = this.$el.outerWidth();
        }
        // Move the list element to the page body
        listEl.appendTo($('body'));
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

  var DropdownFocusListView = FocusListView.extend({
    attributes: { class: 'dropdownList focusList' }
  });

  var DropdownView = Marionette.LayoutView.extend({
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

  var index = {
    DropdownView: DropdownView,
    DropdownMixin: DropdownMixin,
    FocusListView: FocusListView
  };

  return index;

}));
//# sourceMappingURL=dist/js/marionette-dropdown.js.map