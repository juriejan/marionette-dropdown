
import Marionette from 'marionette'

import DropdownMixin from './mixins/dropdown'

export default Marionette.LayoutView.extend({
  mixins: [DropdownMixin],
  template: 'dropdown'
})
