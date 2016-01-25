
import Marionette from 'marionette'

export default Marionette.ItemView.extend({
  tagName: 'li',
  template: (data) => data.text,
  events: {
    mouseover: 'onMouseOver'
  },
  triggers: {
    click: 'select'
  },
  onMouseOver: function () {
    this.trigger('focus')
  },
  attributes: function () {
    return {'data-value': this.model.id}
  }
})
