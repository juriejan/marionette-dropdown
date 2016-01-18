(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('marionette'), require('dust')) :
  typeof define === 'function' && define.amd ? define(['marionette', 'dust'], factory) :
  (global.dropdown = factory(global.Marionette,global.dust));
}(this, function (Marionette,dust) { 'use strict';

  Marionette = 'default' in Marionette ? Marionette['default'] : Marionette;
  dust = 'default' in dust ? dust['default'] : dust;

  var DropdownView = Marionette.LayoutView.extend({});

  (function (dust) {
    dust.register("dropdown", body_0);function body_0(chk, ctx) {
      return chk.w("<button type=\"button\"><div class=\"dropdown-text\"></div><i class=\"icon-expand\" /></button><input type=\"hidden\"").x(ctx.get(["name"], false), ctx, { "block": body_1 }, {}).w(" /><div class=\"dropdown-list invisible shrinkable\"></div>");
    }body_0.__dustBody = !0;function body_1(chk, ctx) {
      return chk.w(" name=\"").f(ctx.get(["name"], false), ctx, "h").w("\"");
    }body_1.__dustBody = !0;return body_0;
  })(dust);

  var index = {
    DropdownView: DropdownView
  };

  return index;

}));
//# sourceMappingURL=dist/js/marionette-dropdown.js.map