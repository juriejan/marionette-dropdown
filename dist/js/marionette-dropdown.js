(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('lodash'), require('backbone'), require('marionette'), require('cocktail'), require('focuslist'), require('jquery'), require('animation'), require('handlebars')) :
    typeof define === 'function' && define.amd ? define(['lodash', 'backbone', 'marionette', 'cocktail', 'focuslist', 'jquery', 'animation', 'handlebars'], factory) :
    (global.dropdown = factory(global._,global.Backbone,global.Marionette,global.Cocktail,global.focuslist,global.$,global.animation,global.Handlebars));
}(this, function (_,Backbone,Marionette,Cocktail,focuslist,$,animation,handlebars) { 'use strict';

    _ = 'default' in _ ? _['default'] : _;
    Backbone = 'default' in Backbone ? Backbone['default'] : Backbone;
    Marionette = 'default' in Marionette ? Marionette['default'] : Marionette;
    Cocktail = 'default' in Cocktail ? Cocktail['default'] : Cocktail;
    $ = 'default' in $ ? $['default'] : $;
    animation = 'default' in animation ? animation['default'] : animation;
    handlebars = 'default' in handlebars ? handlebars['default'] : handlebars;

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

    var ItemView = Marionette.ItemView.extend({
      tagName: 'li',
      template: function template(data) {
        return data.text;
      },
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
      initialize: function initialize(options) {
        this.maxSize = options.maxSize;
        this.expanded = false;
        this.showing = false;
        this.hiding = false;
        this.name = options.name;
        this.parent = options.parent;
        if (this.getCollection) {
          this.collection = this.getCollection();
        } else {
          this.collection = options.collection;
        }
      },
      onRender: function onRender() {
        if (this.expanded) {
          this.list.$el.css({ opacity: 1 });
        }
      },
      onBeforeShow: function onBeforeShow() {
        this.list = new this.focusListView({
          maxSize: this.maxSize,
          childView: this.dropdownItemView,
          collection: this.collection
        });
        this.listenTo(this.list, 'select', this.onItemSelect);
        this.getRegion('list').show(this.list);
        // Determine the scroll parent
        this.scrollParent = this.$el.closest('.nano-content');
        // Flatten the list element
        animation.flat(this.list.$el);
        // Customize reset render for the focus list
        this.list.stopListening(this.collection, 'reset');
        this.listenTo(this.collection, 'reset', this.onCollectionReset);
      },
      onAttach: function onAttach() {
        // Apply parent styles
        this.list.$el.css(this.$el.css(['font-size', 'line-height']));
        // Reset the list width
        this.resetListWidth();
        // Move the list element to the page body
        this.list.$el.appendTo($('body'));
      },
      onCollectionReset: function onCollectionReset() {
        var _this = this;

        this.stopListening(this.list, 'select', this.onItemSelect);
        if (this.expanded) {
          this.hideList(function () {
            return _this.renderAndShowList();
          });
        } else {
          this.renderAndShowList();
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
      renderAndShowList: function renderAndShowList() {
        var _this2 = this;

        this.list.render();
        return this.showList(function () {
          _this2.listenTo(_this2.list, 'select', _this2.onItemSelect);
        });
      },
      setSelection: function setSelection(id) {
        var _this3 = this;

        this.list.children.each(function (child) {
          if (child.model.id === id) {
            _this3.onItemSelect(child);
          }
        });
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
      resetListWidth: function resetListWidth() {
        this.list.$el.outerWidth(this.$el.outerWidth());
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
      showList: function showList(done) {
        var _this4 = this;

        if (!this.showing && !this.hiding && !this.collection.isEmpty()) {
          var listEl = this.list.$el;
          // Reset the list height
          this.list.resetHeight();
          var listHeight = listEl.height();
          // Decide which way to expand the list
          var elOffset = this.$el.offset();
          var windowHeight = $(window).height();
          var elHeight = this.$el.outerHeight();
          var potentialTop = elOffset.top - listHeight;
          var potentialBottom = elOffset.top + elHeight + listHeight;
          this.isExpandedToTop = potentialBottom > windowHeight && potentialTop > 0;
          // Position the list before animation
          this.positionList();
          // Trigger the dropdown show event
          this.trigger('dropdown:show');
          // Attach to event for hiding and scrolling the list on scroll
          this.onParentScrollFunc = this.onParentScroll.bind(this);
          this.scrollParent.on('scroll', this.onParentScrollFunc);
          // Attach to event for hiding the list on click (skip current)
          _.defer(function () {
            _this4.hideListFunc = _.bind(_this4.hideList, _this4, null);
            $(window).one('click', _this4.hideListFunc);
            _this4.scrollParent.one('scroll', _this4.hideListFunc);
          });
          // Expand and show the list
          this.showing = true;
          return animation.grow(listEl, 'height', listHeight).then(function () {
            _this4.showing = false;
            _this4.expanded = true;
            _this4.list.refreshScroll();
            // Call the completed callback
            if (done) {
              done();
            }
            // Trigger freeze on parent if available
            if (_this4.parent) {
              _this4.parent.trigger('freeze');
            }
          });
        }
      },
      hideList: function hideList(done) {
        var _this5 = this;

        if (!this.hiding) {
          var listEl = this.list.$el;
          // Shrink and hide the element
          this.hiding = true;
          return animation.shrink(listEl, 'height').then(function () {
            _this5.hiding = false;
            _this5.expanded = false;
            // Remove focus from all items
            listEl.children().removeClass('focus');
            // Detach from the scroll and hiding events
            $(window).off('click', _this5.hideListFunc);
            _this5.scrollParent.off('scroll', _this5.onParentScrollFunc);
            _this5.scrollParent.off('scroll', _this5.hideListFunc);
            // Call the completed callback
            if (done) {
              done();
            }
            // Trigger the hidden event
            _this5.trigger('hidden');
            // Trigger freeze on parent if available
            if (_this5.parent) {
              _this5.parent.trigger('thaw');
            }
          });
        }
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

    var templates = {
        'dropdown': handlebars.template({ "1": function _(container, depth0, helpers, partials, data) {
                var helper;

                return " name=\"" + container.escapeExpression((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helpers.helperMissing, typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {}, { "name": "name", "hash": {}, "data": data }) : helper)) + "\"";
            }, "compiler": [7, ">= 4.0.0"], "main": function main(container, depth0, helpers, partials, data) {
                var stack1;

                return "<div class=\"dropdown-button\">\n  <div class=\"button-text\"></div>\n  <i class=\"icon-expand\" />\n</div>\n<input type=\"hidden\"" + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {}, depth0 != null ? depth0.name : depth0, { "name": "if", "hash": {}, "fn": container.program(1, data, 0), "inverse": container.noop, "data": data })) != null ? stack1 : "") + " />\n<div class=\"dropdown-list invisible shrinkable\"></div>\n";
            }, "useData": true })
    };

    var DropdownFocusListView = focuslist.FocusListView.extend({
      attributes: { class: 'dropdownList focusList' }
    });

    var DropdownView = Marionette.LayoutView.extend({
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
        this.resetListWidth();
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
      DropdownMixin: DropdownMixin
    };

    return index;

}));
//# sourceMappingURL=marionette-dropdown.js.map