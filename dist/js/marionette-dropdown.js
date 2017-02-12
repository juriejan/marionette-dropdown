(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('lodash'), require('backbone'), require('marionette'), require('cocktail'), require('jquery'), require('focuslist'), require('animation'), require('handlebars')) :
    typeof define === 'function' && define.amd ? define(['lodash', 'backbone', 'marionette', 'cocktail', 'jquery', 'focuslist', 'animation', 'handlebars'], factory) :
    (global.dropdown = factory(global._,global.Backbone,global.Marionette,global.Cocktail,global.$,global.focuslist,global.animation,global.Handlebars));
}(this, function (_,Backbone,Marionette,Cocktail,$,focuslist,animation,handlebars) { 'use strict';

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
      events: {
        keydown: 'onKeyDown'
      },
      initialize: function initialize(options) {
        this.placeholder = this.placeholder || options.placeholder;
        this.allowEmpty = this.allowEmpty || options.allowEmpty;
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
        this.hideListFunc = _.bind(this.hideList, this, null);
      },
      onRender: function onRender() {
        if (this.expanded) {
          this.list.$el.css({ opacity: 1 });
        }
        this.scrollParent = this.$el.closest('.nano-content');
      },
      onParentScroll: function onParentScroll(e) {
        this.positionList();
      },
      onDestroy: function onDestroy() {
        $(window).off('click', this.hideListFunc);
        this.scrollParent.off('scroll', this.hideListFunc);
        this.scrollParent.off('scroll', this.onParentScrollFunc);
        if (this.list) this.list.destroy();
      },
      onKeyDown: function onKeyDown(e) {
        if (this.list && this.list.onKeyDown) this.list.onKeyDown(e);
      },
      onAttach: function onAttach() {
        // Create the list view
        this.list = new this.focusListView({
          childView: this.dropdownItemView,
          collection: this.collection,
          scroll: this.options.scroll
        });
        // Attach to list events
        this.listenTo(this.list, 'render:collection', this.onListCollectionRender);
        // Render the list before showing
        this.list.render();
        // Set the list width if specified
        if (this.options.listHeight) {
          this.list.$el.css('height', this.options.listHeight);
        }
        // Make list invisible
        animation.visible(this.list.$el, false);
        // Reset the list width
        this.resetListWidth();
        // Move the list element to the indicated overlay
        this.getOverlay().append(this.list.$el);
        // Refresh the list scrolling
        if (this.options.scroll) this.list.refreshScroll();
      },
      onListCollectionRender: function onListCollectionRender() {
        if (this.options.scroll) this.list.refreshScroll();
      },
      resetListWidth: function resetListWidth() {
        if (this.options.scroll) {
          var width = this.options.listWidth || this.$el.outerWidth();
          this.list.$el.outerWidth(width);
        }
      },
      serializeData: function serializeData() {
        return {
          name: this.name,
          placeholder: this.placeholder
        };
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
        var windowWidth = $(window).width();
        var elOffset = this.$el.offset();
        var elHeight = this.$el.outerHeight();
        var elWidth = this.$el.outerWidth();
        var listWidth = this.list.$el.outerWidth();
        var listHeight = 500;
        // let listHeight = this.list.$el.outerHeight()
        var potentialTop = elOffset.top - listHeight;
        var potentialBottom = elOffset.top + elHeight + listHeight;
        var potentialRight = elOffset.left + listWidth;
        var expandedToLeft = potentialRight > windowWidth;
        var expandedToTop = potentialBottom > windowHeight && potentialTop > 0;
        if (expandedToTop) {
          listEl.css({ top: '', bottom: windowHeight - (elOffset.top + elHeight) });
        } else {
          listEl.css({ top: elOffset.top, bottom: '' });
        }
        if (expandedToLeft) {
          listEl.css({ right: windowWidth - (elOffset.left + elWidth) });
        } else {
          listEl.css({ left: elOffset.left });
        }
      },
      showList: function showList() {
        var _this = this;

        if (!this.showing && !this.hiding && (!this.collection.isEmpty() || this.allowEmpty)) {
          // Add the class indicating open status
          this.$el.addClass('open');
          // Raise the element to maintain visiblity
          this.$el.css('z-index', 2);
          // Attach to the list close event
          this.list.listenTo(this.list, 'close', this.hideList.bind(this));
          // Prevent list from automatically rendering on collection reset
          this.list.stopListening(this.collection, 'reset');
          // Get the list element
          var listEl = this.list.$el;
          // Position the list before animation
          this.positionList();
          // Trigger the dropdown show event
          this.trigger('dropdown:show');
          // Attach to event for hiding and scrolling the list on scroll
          this.onParentScrollFunc = this.onParentScroll.bind(this);
          this.scrollParent.on('scroll', this.onParentScrollFunc);
          // Expand and show the list
          this.showing = true;
          return animation.show(listEl).then(function () {
            _this.showing = false;
            _this.expanded = true;
            // Listen to select events
            _this.listenTo(_this.list, 'select', _this.onItemSelect);
            // Trigger freeze on parent if available
            if (_this.parent) {
              _this.parent.trigger('freeze');
            }
            // Attach to event for hiding the list on click (skip current)
            _.defer(function () {
              $(window).one('click', _this.hideListFunc);
              _this.scrollParent.one('scroll', _this.hideListFunc);
            });
          });
        } else {
          return Promise.resolve();
        }
      },
      hideList: function hideList() {
        var _this2 = this;

        if (!this.hiding && this.expanded || this.showing) {
          // Remove the class indicating open status
          this.$el.removeClass('open');
          // Remove the item select handler after potential handling
          _.defer(function () {
            return _this2.stopListening(_this2.list, 'select', _this2.onItemSelect);
          });
          // Shrink and hide the element
          this.hiding = true;
          return animation.hide(this.list.$el).then(function () {
            _this2.hiding = false;
            _this2.expanded = false;
            // Return the element to it's original level
            _this2.$el.css('z-index', '');
            // Detach the hide from the window click
            $(window).off('click', _this2.hideListFunc);
            // Detach the hide from the scroll
            _this2.scrollParent.off('scroll', _this2.onParentScrollFunc);
            _this2.scrollParent.off('scroll', _this2.hideListFunc);
            // Trigger the hidden event
            _this2.trigger('hidden');
            // Trigger freeze on parent if available
            if (_this2.parent) {
              _this2.parent.trigger('thaw');
            }
          });
        } else {
          return Promise.resolve();
        }
      }
    };

    var templates = {
        'dropdown': handlebars.template({ "1": function _(container, depth0, helpers, partials, data) {
                var helper;

                return " name=\"" + container.escapeExpression((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helpers.helperMissing, typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {}, { "name": "name", "hash": {}, "data": data }) : helper)) + "\"";
            }, "compiler": [7, ">= 4.0.0"], "main": function main(container, depth0, helpers, partials, data) {
                var stack1;

                return "<div class=\"dropdown-button\">\n  <div class=\"button-text\"></div>\n  <i class=\"icons expand\">expand_more</i>\n</div>\n<input type=\"hidden\"" + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {}, depth0 != null ? depth0.name : depth0, { "name": "if", "hash": {}, "fn": container.program(1, data, 0), "inverse": container.noop, "data": data })) != null ? stack1 : "") + " />\n";
            }, "useData": true }),
        'spinner': handlebars.template({ "compiler": [7, ">= 4.0.0"], "main": function main(container, depth0, helpers, partials, data) {
                return "<svg class=\"spinner\" width=\"65px\" height=\"65px\" viewBox=\"0 0 66 66\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle class=\"spinner-path\" fill=\"none\" stroke-width=\"6\" stroke-linecap=\"round\" cx=\"33\" cy=\"33\" r=\"30\"></circle>\n</svg>\n";
            }, "useData": true })
    };

    var spinnerHtml = templates['spinner']({});

    function add(el) {
      var loadingEl = $('<div class="loading"></div>');
      loadingEl.append(spinnerHtml);
      el.append(loadingEl);
    }

    function remove(el) {
      el.children('.loading').remove();
    }

    function loading(el, on) {
      if (on) {
        add(el);
      } else {
        remove(el);
      }
    }

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

    function loadingActions(view) {
      view.listenTo(view, 'loading', function () {
        loading(view.$el, true);
      });
      view.listenTo(view, 'loaded', function () {
        loading(view.$el, false);
      });
    }

    var utils = {
      defined: defined,
      loadingActions: loadingActions,
      loadingEvents: loadingEvents
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
        'click @ui.button': 'onButtonClick',
        'focus @ui.button': 'onButtonFocus',
        'blur @ui.button': 'onButtonBlur'
      },
      initialize: function initialize(options) {
        this.listenTo(this, 'dropdown:show', this.onDropdownShow);
        utils.loadingEvents(this, this.collection);
        utils.loadingActions(this, true);
      },
      onDropdownShow: function onDropdownShow() {
        // Indicate currently selected item with focus
        if (this.selected) {
          var child = this.list.findByModel(this.selected);
          if (child) {
            child.$el.addClass('focus');
          }
        }
      },
      onAttach: function onAttach() {
        this.listenTo(this.collection, 'reset', this.determineState);
        this.determineState();
      },
      onInputChange: function onInputChange() {
        var value = this.ui.input.val();
        this.selectId(value);
      },
      onButtonClick: function onButtonClick(e) {
        e.preventDefault();
        if (!this.expanded) {
          _.defer(this.showList.bind(this));
        } else {
          _.defer(this.hideList.bind(this));
          this.ui.button.blur();
        }
      },
      onButtonFocus: function onButtonFocus(e) {
        e.stopPropagation();
        e.preventDefault();
        if (!this.expanded) {
          _.defer(this.showList.bind(this));
        }
      },
      onButtonBlur: function onButtonBlur(e) {
        if (this.expanded) {
          var focusedView = this.list.findFocusedItem();
          if (focusedView !== undefined) {
            this.list.trigger('select', focusedView);
          }
        } else {
          this.hideList();
        }
      },
      onItemSelect: function onItemSelect(child) {
        this.select(child.model, true);
        this.hideList();
      },
      getOverlay: function getOverlay() {
        return $('body');
      },
      getFirst: function getFirst() {
        var visible = this.collection.filter(function (o) {
          return !(o.get('visible') === false);
        });
        return _.first(visible);
      },
      getSelected: function getSelected() {
        return this.selected;
      },
      determineState: function determineState() {
        if (this.allowEmpty === true || this.collection.size() > 0) {
          this.disabled = false;
        } else if (this.collection.size() === 0) {
          this.disabled = true;
        }
        if (this.disabled) {
          this.$el.addClass('disabled');
          this.ui.button.attr('tabindex', -1);
          this.select(null, true);
        } else {
          this.$el.removeClass('disabled');
          if (this.ui.button.attr) this.ui.button.attr('tabindex', 0);
          if (this.selectedId) {
            this.select(this.collection.get(this.selectedId), true);
            this.selectedId = null;
          } else {
            var id = this.ui.input.val() || this.selected && this.selected.id;
            this.select(this.collection.get(id) || this.getFirst(), true);
          }
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
          var item = this.collection.get(id);
          if (!item) {
            this.selectedId = id;
          } else {
            this.select(this.collection.get(id), trigger);
          }
        }
      },
      setVisibleOptions: function setVisibleOptions(visible) {
        // Set the visibility of each model in the collection
        this.collection.each(function (model) {
          model.set('visible', _.includes(visible, model.id), { silent: true });
        });
        // Trigger a change event on the collection
        this.collection.trigger('change');
        // Determine if the selection should be changed
        if (this.selected) {
          if (this.selected.get('visible') === false) {
            this.select(this.getFirst());
          }
        }
      }
    });

    var index = {
      DropdownView: DropdownView,
      DropdownItemView: ItemView,
      DropdownMixin: DropdownMixin
    };

    return index;

}));
//# sourceMappingURL=marionette-dropdown.js.map