(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('marionette')) :
  typeof define === 'function' && define.amd ? define(['marionette'], factory) :
  (global.dropdown = factory(global.Marionette));
}(this, function (Marionette) { 'use strict';

  Marionette = 'default' in Marionette ? Marionette['default'] : Marionette;

  var DropdownView = Marionette.LayoutView.extend({});

  var index = {
    DropdownView: DropdownView
  };

  return index;

}));
//# sourceMappingURL=dist/js/marionette-dropdown.js.map