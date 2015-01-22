/* global Ractive */

var template =
`{{#_wnd_rendered}}<div id='ractive-window-{{.id}}' class='ractive-window{{#(.buttons.length > 0)}} with-buttons{{/}}{{#.resizable}} resizable{{else}} fixed{{/}}{{#.geometry.state === 2}} maximized{{/}}{{#.class.window}} {{.class.window}}{{/}}' on-click='_raise' style='{{#.hidden}}display: none;{{/}}top: {{.geometry.top}}px; left: {{.geometry.left}}px; {{#(.resizable || .geometry.state === 2)}}width: {{.geometry.width}}{{.geometry.dunit}}; height: {{.geometry.height}}{{.geometry.dunit}}; {{/}}z-index: {{.geometry.index}};{{#.style.window}} {{.style.window}}{{/}}'>
  <div class='rw-modal' on-mousedown='_moveStart' style='{{^.blocked}}display: none;{{/}}'></div>
  <div class='rw-interior'>
    <div class='rw-controls'>{{>controls}}</div>
    <div class='rw-title' on-touchstart-mousedown='_moveStart' on-dblclick='_restore'>{{>title}}</div>
    <div class='rw-body{{#.class.body}} {{.class.body}}{{/}}' {{#.style.body}}style='{{.style.body}}'{{/}}>{{>body}}</div>
    {{#(.buttons.length > 0)}}<div class='rw-buttons'>{{>buttons}}</div>{{/}}
    <div class='rw-resize-handle' on-touchstart-mousedown='_resizeStart'></div>
    <div class='rw-foot'>{{>foot}}</div>
  </div>
</div>{{/}}`;

var Window;
Window = Ractive.extend({
  template: template,
  onconstruct: function(opts) {
    var wnd = this;

    var sx, sy;
    var moveFn;
    moveFn = function(e) {
      var x, y;
      if (e.type.indexOf('touch') >= 0) {
        x = +(e.changedTouches[0].clientX);
        y = +(e.changedTouches[0].clientY);
      } else {
        x = +(e.x || e.clientX);
        y = +(e.y || e.clientY);
      }

      wnd.move(+wnd.get('geometry.left') + x - +sx, +wnd.get('geometry.top') + y - +sy);
      sx = x;
      sy = y;
      if (e.type === 'mouseup' || e.type === 'touchend') {
        document.removeEventListener('mousemove', moveFn, false);
        document.removeEventListener('mouseup', moveFn, false);
        document.removeEventListener('touchmove', moveFn, false);
        document.removeEventListener('touchend', moveFn, false);
      }
    };
    wnd.on('_moveStart', function(e) {
      if ((e.original.type === 'mousedown' && e.original.button === 0) || e.original.type === 'touchstart') {
        wnd.restore();
        if (e.original.type.indexOf('touch') >= 0) {
          sx = +(e.original.changedTouches[0].clientX);
          sy = +(e.original.changedTouches[0].clientY);
        } else {
          sx = +(e.original.x || e.original.clientX);
          sy = +(e.original.y || e.original.clientY);
        }
        document.addEventListener('mousemove', moveFn);
        document.addEventListener('mouseup', moveFn);
        document.addEventListener('touchmove', moveFn);
        document.addEventListener('touchend', moveFn);
        e.original.preventDefault();
      }
    });

    var resizeFn;
    resizeFn = function(e) {
      var x, y;
      if (e.type.indexOf('touch') >= 0) {
        x = e.changedTouches[0].clientX;
        y = e.changedTouches[0].clientY;
      } else {
        x = +(e.x || e.clientX);
        y = +(e.y || e.clientY);
      }
      var w = +wnd.get('geometry.width') + (x - +sx);
      var h = +wnd.get('geometry.height') + (y - +sy);
      wnd.resize(w, h);
      sx = x;
      sy = y;
      if (e.type === 'mouseup' || e.type === 'touchend') {
        document.removeEventListener('mousemove', resizeFn, false);
        document.removeEventListener('mouseup', resizeFn, false);
        document.removeEventListener('touchmove', resizeFn, false);
        document.removeEventListener('touchend', resizeFn, false);
      }
    };
    wnd.on('_resizeStart', function(e) {
      if ((e.original.type == 'mousedown' && e.original.button === 0) || e.original.type === 'touchstart') {
        wnd.restore();
        if (e.original.type.indexOf('touch') >= 0) {
          sx = e.original.changedTouches[0].clientX;
          sy = e.original.changedTouches[0].clientY;
        } else {
          sx = (e.original.x || e.original.clientX);
          sy = (e.original.y || e.original.clientY);
        }
        document.addEventListener('mousemove', resizeFn);
        document.addEventListener('mouseup', resizeFn);
        document.addEventListener('touchmove', resizeFn);
        document.addEventListener('touchend', resizeFn);
      }
    });

    var stateFn = function(target, e) {
      switch (target) {
        case 'min': wnd.minimize(); break;
        case 'max': wnd.maximize(); break;
        case 'normal': wnd.restore(); break;
        default: break;
      }
    };

    wnd.on('_minimize', function(e) { stateFn('min', e); });
    wnd.on('_restore', function(e) {
      switch (wnd.get('geometry.state')) {
        case 0: stateFn('max', e); break;
        case 1:
          case 2:
          stateFn('normal', e); break;
        default: break;
      }
    });
    wnd.on('_raise', function(e) { wnd.raise(); });
    wnd.on('_close', function(e) { wnd.close(); });
    wnd.on('_dialog-button', function(e) {
      var fn = e.context.action;
      if (!!fn && typeof fn === 'function') fn.call(this);
    });

    wnd.result = null;
    wnd.waitForClose = wnd.afterClose = new Ractive.Promise(function(y, n) {
      var fn = function(t) {
        return function(v) {
          wnd.completeAfterClose = null;
          wnd.rejectAfterClose = null;
          t(v);
        };
      };
      wnd.completeAfterClose = fn(y);
      wnd.rejectAfterClose = fn(n);
    });
  },
  onrender() {
    if (!!!this.get('buttonClass') && !!this.parent.get('buttonClass')) {
      this.set('buttonClass', this.parent.get('buttonClass'));
    }

    this.watchers = this.observe({
      title: (n, o) => {
        this.fire('retitle', n, this);
      },

      'geometry.state': (n, o) => {
        switch (n) {
          case 0: this.fire('restore', n, this); break;
          case 1: this.fire('minimize', n, this); break;
          case 2: this.fire('maximize', n, this); break;
        }
      }
    });
  },
  onunrender() { if (this.watchers && typeof this.watchers.cancel === 'function') this.watchers.cancel(); },
  activated() {},
  data() { return {
    _wnd_rendered: false,
    blocked: false,
    resizable: true,
    geometry: {
      top: -9999, left: -9999, width: 200, height: 200, state: 0, dunit: 'px', index: 1000,
      minimum: { x: 0, y: 0, width: 70, height: 50 }
    },
    style: {},
    class: {}
  }; },
  partials: {
    title: '{{ .title }}',
    body: '',
    foot: '',
    buttons: "{{#.buttons}}<button on-click='_dialog-button' class='{{.position || ''}}{{#.buttonClass}} {{.buttonClass}}{{/}}{{#../../class.button}} {{../../class.button}}{{/}}' disabled='{{!.enabled}}'>{{ .label }}</button>{{/}}",
    controls: '{{>minimizeControl}}{{>restoreControl}}{{>closeControl}}',
    minimizeControl: "<button on-click='_minimize' class='rw-minimize'>{{>minimizeControlLabel}}</button>",
    minimizeControlLabel: "_",
    restoreControl: "<button on-click='_restore' class='rw-restore'>{{>restoreControlLabel}}</button>",
    restoreControlLabel: "^",
    closeControl: "<button on-click='_close' class='rw-close'>{{>closeControlLabel}}</button>",
    closeControlLabel: "X"
  },
  rerender: function() {
    var wnd = this;
    if (!wnd.get('_wnd_rendered')) return Ractive.Promise.resolve('ok');
    wnd.set('_wnd_rendered', false);
    return this.set('_wnd_rendered', true);
  },
  title: function(str) { this.set('title', str); },
  move: function(x, y) {
    if (typeof x === 'string') {
      switch (x) {
        case 'center':
          case 'centerScreen':
          return this.set({
          'geometry.top': (this.parent.el.clientHeight - this.element.clientHeight) / 2,
          'geometry.left': (this.parent.el.clientWidth - this.element.clientWidth) / 2
        });
        case 'cascade':
          return this.set({
          'geometry.top': ((this.parentNumber % 10) * 20) + 10,
          'geometry.left': ((this.parentNumber % 50) * 20) + 10
        });
      }
      return Ractive.Promise.resolve(false);
    }
    y = +y;
    x = +x;
    var min = this.get('geometry.minimum');
    var max = this.get('geometry.maximum');
    var w = +this.get('geometry.width');
    var h = +this.get('geometry.height');
    if (!!max) {
      if (x + w > +max.x) x = +max.x - x;
      if (y + h > +max.y) y = +max.y - y;
    }
    if (!!min) {
      if (x < +min.x) x = +min.x;
      if (y < +min.y) y = +min.y;
    }
    return this.set({
      'geometry.top': y,
      'geometry.left': x
    });
  },
  resize: function(w, h) {
    var min = this.get('geometry.minimum');
    var max = this.get('geometry.maximum');
    if (!!max) {
      if (w > max.width) w = max.width;
      if (w > max.height) w = max.height;
    }
    if (!!min) {
      if (w < min.width) w = min.width;
      if (h < min.height) h = min.height;
    }
    this.set({
      'geometry.width': w,
      'geometry.height': h
    });
  },
  resizable: function(b) { this.set('resizable', b); },
  minimize: function() {
    var wnd = this;
    if (wnd.get('geometry.state') !== 1) {
      wnd.set({
        hidden: true,
        'geometry.state': 1
      });
      wnd.fire('minimized', { window: wnd });
    }
  },
  maximize: function() {
    var wnd = this;
    if (wnd.get('geometry.state') !== 2) {
      wnd.normalGeometry = { top: wnd.get('geometry.top'), left: wnd.get('geometry.left'), width: wnd.get('geometry.width'), height: wnd.get('geometry.height') };
      wnd.set({
        'hidden': false,
        'geometry.left': 0,
        'geometry.top': 0,
        'geometry.width': 100,
        'geometry.height': 100,
        'geometry.dunit': '%',
        'geometry.state': 2
      });
      wnd.fire('maximized', { window: wnd });
    }
  },
  restore: function() {
    var wnd = this;
    switch (wnd.get('geometry.state')) {
      case 1: // minimized
        wnd.set({
        hidden: false,
        'geometry.state': 0
      });
      wnd.fire('restored', { window: wnd });
      break;
      case 2:
        var g = wnd.normalGeometry || {};
      wnd.normalGeometry = null;
      wnd.set({
        hidden: false,
        'geometry.left': g.left,
        'geometry.top': g.top,
        'geometry.width': g.width,
        'geometry.height': g.height,
        'geometry.dunit': 'px',
        'geometry.state': 0
      });
      break;
      default: break;
    }
    this.raise();
  },
  raise: function() {
    if (!!this.parent) this.parent.raiseWindow(this);
  },
  kill: function() {
    var wnd = this;
    this.fire('close', this);
    if (!!wnd.parent) {
      wnd.parent.killWindow(wnd);
    } else {
      wnd.teardown();
    }
    if (!!wnd.completeAfterClose) wnd.completeAfterClose(wnd.result);
  },
  content: function(ct) {
    return this.resetPartial('body', ct);
  },
  buttons: function() {
    var arr = [], i;
    this.set('buttons', arr);
    if (arguments.length === 1 && typeof arguments[0].length === 'number') {
      arr = arguments[0];
    } else {
      for (i = 0; i < arguments.length; i++) {
        arr.push(arguments[i]);
      }
    }
    var left = [], right = [], middle = [];
    for (i = 0; i < arr.length; i++) {
      var b = arr[i];
      if (!!b.position) {
        if (b.position === 'left') left.push(b);
        else if (b.position === 'right') right.push(b);
        else if (b.position === 'middle') middle.push(b);
        else if (b.position === 'center') middle.push(b);
        else { right.push(b); b.position = 'right'; }
      } else { right.push(b); b.position = 'right'; }
      if (!b.hasOwnProperty('enabled')) b.enabled = true;
    }
    arr = [];
    for (i = 0; i < left.length; i++) arr.push(left[i]);
    for (i = right.length - 1; i >= 0; i--) arr.push(right[i]);
    for (i = 0; i < middle.length; i++) arr.push(middle[i]);
    this.set('buttons', arr);
  },
  button: function(name, cb) {
    var arr = this.get('buttons');
    var btn, i;
    if (typeof name === 'number') { btn = arr[name]; i = name; }
    else for (i = 0; i < arr.length; i++) {
      if (arr[i].label === name) {
        btn = arr[i];
        break;
      }
    }

    if (!!btn) {
      cb(btn);
      this.set('buttons.' + i, btn);
    }
  },
  controls: function() {
    var arr = [], i, str = '';
    if (arguments.length === 1 && typeof arguments[0] !== 'string') arr = arguments[0];
    else {
      for (i = 0; i < arguments.length; i++) arr.push(arguments[i]);
    }
    for (i = 0; i < arr.length; i++) str += '{{>' + arr[i] + 'Control}}';
    this.partials.controls = str;
    return this.rerender();
  },
  onClose: function() {
    this.kill();
  },
  close: function(fn) {
    if (!!!fn) fn = this.onClose;
    if (fn.length === 0) fn.call(this);
    else {
      var wnd = this;
      fn.call(this, function(close) { if (close) wnd.kill(); });
    }
  }
});

export default Window;
