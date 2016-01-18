
var getOriginal = function (el, name) {
  var current = el.css(name)
  el.css(name, '')
  var original = el.css(name)
  el.css(name, current)
  return original
}

var determineSize = function (el, side) {
  if (side === 'top' || side === 'bottom') {
    return parseInt(el.css('height'), 10)
  } else if (side === 'left' || side === 'right') {
    return parseInt(el.css('width'), 10)
  }
}

export default {
  show: function (el, done) {
    el.velocity({opacity: 1}, {
      easing: 'easeInOutCubic',
      duration: 'fast',
      complete: done,
      visibility: 'visible',
      queue: false
    })
  },
  hide: function (el, done) {
    el.velocity({opacity: 0}, {
      easing: 'easeInOutCubic',
      duration: 'fast',
      complete: done,
      visibility: 'hidden',
      queue: false
    })
  },
  slideOut: function (el, side, done, progress) {
    var margin = 'margin-' + side
    var properties = {opacity: 1}
    var size = determineSize(el, side)
    // Set the initial css properties
    el.css(margin, '-' + size + 'px')
    el.css('display', '')
    // Animate to the new properties
    properties[margin] = 0
    el.velocity(properties, {
      easing: 'easeInOutCubic',
      progress: progress,
      complete: done
    })
  },
  slideIn: function (el, side, done, progress) {
    var margin = 'margin-' + side
    var properties = {opacity: 0}
    var size = determineSize(el, side)
    // Animate to the new properties
    properties[margin] = '-' + size + 'px'
    el.velocity(properties, {
      easing: 'easeInOutCubic',
      progress: progress,
      complete: done
    })
  },
  flexGrow: function (el, basis, show, done) {
    var final = {'flex-grow': '1'}
    if (show) { final.opacity = 1 }
    if (basis) { final['flex-basis'] = basis + 'px' }
    el.velocity(final, {easing: 'easeInOutCubic', complete: done})
  },
  flexShrink: function (el, basis, hide, done) {
    var final = {'flex-grow': '.0001'}
    if (hide) { final.opacity = 0 }
    if (basis) { final['flex-basis'] = basis + 'px' }
    el.velocity(final, {easing: 'easeInOutCubic', complete: done})
  },
  grow: function (el, dimension, size, done) {
    // Set the initial styles
    var initial = {opacity: 0}
    initial[dimension] = 0
    el.css(initial)
    // Animate the grow
    var final = {opacity: 1}
    // Determine the size to grow to
    if (size) {
      final[dimension] = size
    } else {
      final[dimension] = getOriginal(el, dimension)
    }
    // Detemrine the original margins
    if (dimension === 'width') {
      final['margin-left'] = getOriginal(el, 'margin-left')
      final['margin-right'] = getOriginal(el, 'margin-right')
      final['padding-right'] = getOriginal(el, 'padding-right')
      final['padding-left'] = getOriginal(el, 'padding-left')
    } else {
      final['margin-top'] = getOriginal(el, 'margin-top')
      final['margin-bottom'] = getOriginal(el, 'margin-bottom')
      final['padding-top'] = getOriginal(el, 'padding-top')
      final['padding-bottom'] = getOriginal(el, 'padding-bottom')
    }
    // Initiate animation
    el.velocity(final, {
      easing: 'easeInOutCubic',
      display: '',
      queue: false,
      complete: done
    })
  },
  shrink: function (el, dimension, done) {
    var final = {opacity: 0}
    final[dimension] = 0
    // Set the appropriate margins to zero
    if (dimension === 'width') {
      final['margin-left'] = 0
      final['margin-right'] = 0
      final['padding-left'] = 0
      final['padding-right'] = 0
    } else {
      final['margin-top'] = 0
      final['margin-bottom'] = 0
      final['padding-top'] = 0
      final['padding-bottom'] = 0
    }
    // Initiate animation
    el.velocity(final, {
      easing: 'easeInOutCubic',
      display: '',
      queue: false,
      complete: done
    })
  },
  toggleIcon: function (onIcon, offIcon, status, animate) {
    if (animate) {
      if (status) {
        onIcon.velocity({opacity: 0}, {easing: 'easeInOutCubic'})
        offIcon.velocity({opacity: 1}, {easing: 'easeInOutCubic'})
      } else {
        onIcon.velocity({opacity: 1}, {easing: 'easeInOutCubic'})
        offIcon.velocity({opacity: 0}, {easing: 'easeInOutCubic'})
      }
    } else {
      if (status) {
        onIcon.css({opacity: 0})
        offIcon.css({opacity: 1})
      } else {
        onIcon.css({opacity: 1})
        offIcon.css({opacity: 0})
      }
    }
  },
  showRegion: function (region, view, done) {
    region.show(view)
    this.show(region.$el, done)
  },
  hideRegion: function (region, done) {
    if (region.hasView()) {
      this.hide(region.$el, function () {
        region.reset()
        if (done) { done() }
      })
    } else {
      if (done) { done() }
    }
  },
  scroll: function (el, container) {
    el.velocity('scroll', {
      axis: 'y',
      duration: 'fast',
      easing: 'easeInOutCubic',
      container: container
    })
  },
  thin: function (el) {
    el.css({
      opacity: 0,
      width: 0,
      'margin-left': 0,
      'margin-right': 0,
      'padding-left': 0,
      'padding-right': 0
    })
  },
  flat: function (el) {
    el.css({
      opacity: 0,
      height: 0,
      'margin-top': 0,
      'margin-bottom': 0,
      'padding-top': 0,
      'padding-bottom': 0
    })
  },
  original: function (el) {
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
    })
  },
  in: function (el, side) {
    var margin = 'margin-' + side
    var properties = {opacity: 0}
    var size = determineSize(el, side)
    // Set the element css
    properties[margin] = '-' + size + 'px'
    el.css(properties)
  },
  visible: function (el, state) {
    if (state) {
      el.css({opacity: 1, visibility: 'visible'})
    } else {
      el.css({opacity: 0, visibility: 'hidden'})
    }
  }
}
