var Ractive = require('ractive');

module.exports = res = {};

(function() {
  var template = "{{#.rendered}}" +
    "<div id='ractive-window-{{.id}}' class='ractive-window{{#(.buttons.length > 0)}} with-buttons{{/}}{{#.resizable}} resizable{{/}}{{^.resizable}} fixed{{/}}{{#.class.window}} {{.class.window}}{{/}}' on-click='raise' style='{{#.hidden}}display: none;{{/}}top: {{.geometry.top}}px; left: {{.geometry.left}}px; {{#(.resizable || .geometry.state === 2)}}width: {{.geometry.width}}{{.geometry.dunit}}; height: {{.geometry.height}}{{.geometry.dunit}}; {{/}}z-index: {{.geometry.index}};{{#.style.window}} {{.style.window}}{{/}}'>" +
    "  <div class='rw-modal' on-mousedown='moveStart' style='{{^.blocked}}display: none;{{/}}'></div>" +
    "  <div class='rw-interior'>" +
    "    <div class='rw-controls'>{{>controls}}</div>" +
    "    <div class='rw-title' on-mousedown='moveStart' on-dblclick='restore'>{{>title}}</div>" +
    "    <div class='rw-body{{#.class.body}} {{.class.body}}{{/}}' style='{{#.style.body}}{{.style.body}}{{/}}'>{{>body}}</div>" +
    "    {{#(.buttons.length > 0)}}<div class='rw-buttons'>{{>buttons}}</div>{{/}}" +
    "    <div class='rw-resize-handle' on-mousedown='resizeStart'></div>" +
    "    <div class='rw-foot'>{{>foot}}</div>" +
    "  </div>" +
    "</div>{{/}}";

  var Window;
  Window = Ractive.extend({
    template: template,
    init: function() {
      var wnd = this;

      this.set({
        geometry: {
          top: 20, left: 20, width: 200, height: 200, state: 0, dunit: 'px', index: 1000,
          minimum: { x: 0, y: 0, width: 70, height: 50 }
        },
        style: {},
        class: {}
      });

      var sx, sy;
      var moveFn;
      moveFn = function(e) {
        var x = +wnd.get('geometry.left') + (+(e.x || e.clientX) - +sx);
        var y = +wnd.get('geometry.top') + (+(e.y || e.clientY) - +sy);
        wnd.move(x, y);
        sx = +(e.x || e.clientX);
        sy = +(e.y || e.clientY);
        if (e.type == 'mouseup') {
          document.removeEventListener('mousemove', moveFn, false);
          document.removeEventListener('mouseup', moveFn, false);
        }
      };
      wnd.on('moveStart', function(e) {
        if (e.original.type === 'mousedown' && e.original.button === 0) {
          wnd.restore();
          sx = +(e.original.x || e.original.clientX);
          sy = +(e.original.y || e.original.clientY);
          document.addEventListener('mousemove', moveFn);
          document.addEventListener('mouseup', moveFn);
        }
      });

      var resizeFn;
      resizeFn = function(e) {
        var w = +wnd.get('geometry.width') + (+(e.x || e.clientX) - +sx);
        var h = +wnd.get('geometry.height') + (+(e.y || e.clientY) - +sy);
        wnd.resize(w, h);
        sx = +(e.x || e.clientX);
        sy = +(e.y || e.clientY);
        if (e.type == 'mouseup') {
          document.removeEventListener('mousemove', resizeFn, false);
          document.removeEventListener('mouseup', resizeFn, false);
        }
      };
      wnd.on('resizeStart', function(e) {
        if (e.original.type == 'mousedown' && e.original.button === 0) {
          wnd.restore();
          sx = (e.original.x || e.original.clientX);
          sy = (e.original.y || e.original.clientY);
          document.addEventListener('mousemove', resizeFn);
          document.addEventListener('mouseup', resizeFn);
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

      wnd.on('minimize', function(e) { stateFn('min', e); });
      wnd.on('restore', function(e) {
        switch (wnd.get('geometry.state')) {
          case 0: stateFn('max', e); break;
          case 1:
          case 2:
            stateFn('normal', e); break;
          default: break;
        }
      });
      wnd.on('raise', function(e) { wnd.raise(); });
      wnd.on('close', function(e) { wnd.close(); });
      wnd.on('dialog-button', function(e) {
        var fn = e.context.action;
        if (!!fn && typeof fn === 'function') fn.call(this);
      });
    },
    loaded: function() {
      if (!!!this.get('buttonClass') && !!this.windowHost.get('buttonClass')) {
        this.set('buttonClass', this.windowHost.get('buttonClass'));
      }
    },
    activated: function() {},
    data: {
      rendered: false,
      blocked: false,
      resizable: true
    },
    partials: {
      title: '{{ .title }}',
      body: '',
      foot: '',
      buttons: "{{#.buttons}}<button on-click='dialog-button' class='{{.position || ''}}{{#.buttonClass}} {{.buttonClass}}{{/}}' disabled='{{!.enabled}}'>{{ .label }}</button>{{/}}",
      controls: '{{>minimizeControl}}{{>restoreControl}}{{>closeControl}}',
      minimizeControl: "<button on-click='minimize' class='rw-minimize'>{{>minimizeControlLabel}}</button>",
      minimizeControlLabel: "_",
      restoreControl: "<button on-click='restore' class='rw-restore'>{{>restoreControlLabel}}</button>",
      restoreControlLabel: "^",
      closeControl: "<button on-click='close' class='rw-close'>{{>closeControlLabel}}</button>",
      closeControlLabel: "X"
    },
    rerender: function() {
      var wnd = this;
      if (!wnd.get('rendered')) return Ractive.Promise.resolve('ok');
      wnd.set('rendered', false);
      return this.set('rendered', true);
    },
    title: function(str) { this.set('title', str); },
    move: function(x, y) {
      if (typeof x === 'string') {
        switch (x) {
          case 'center':
          case 'centerScreen':
            this.set({
              'geometry.top': (this.windowHost.el.clientHeight - this.element.clientHeight) / 2,
              'geometry.left': (this.windowHost.el.clientWidth - this.element.clientWidth) / 2
            });
            break;
          case 'cascade':
            this.set({
              'geometry.top': ((this.parentNumber % 10) * 20) + 10,
              'geometry.left': ((this.parentNumber % 50) * 20) + 10
            });
            break;
        }
        return;
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
      this.set({
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
    },
    raise: function() {
      var parent = this.windowHost;
      if (!!parent) parent.raiseWindow(this);
    },
    kill: function() {
      var wnd = this;
      if (!!wnd.windowHost) {
        wnd.windowHost.killWindow(wnd);
      } else {
        wnd.detach();
        wnd.teardown();
      }
    },
    content: function(ct) {
      this.partials.body = ct;
      return this.rerender();
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
      var wnd = this;
      wnd.kill();
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


  res.Window = Window;

  var messageButtons = {
    ok: { label: 'OK', action: function() { this.result = 'ok'; this.close(); }, position: 'middle' },
    cancel: { label: 'Cancel', action: function() { this.result = 'cancel'; this.close(); }, position: 'middle' },
    yes: { label: 'Yes', action: function() { this.result = 'yes'; this.close(); }, position: 'middle' },
    no: { label: 'No', action: function() { this.result = 'no'; this.close(); }, position: 'middle' }
  };

  var WindowHost;
  WindowHost = function() {
    var counter = 0;
    return Ractive.extend({
      isolated: true,
      defaults: {
        control: {
          label: function label(control, lbl) { Window.partials[control + 'ControlLabel'] = lbl; }
        },
        controls: function() {
          var partial = '';
          for (var i = 0; i < arguments.length; i++) {
            partial += '{{>' + arguments[i] + 'Control}}';
          }
          Window.partials.controls = partial;
        }
      },
      components: { Window: Window },
      data: { windowSlots: [], windows: {}, blocks: {}, globalBlock: null },
      computed: { blocked: function() { return !!this.get('globalBlock'); } },
      template: "<div class='ractive-window-host-modal' style='{{^blocked}}display: none;{{/blocked}}'></div>{{#windowSlots}}<Window/>{{/windowSlots}}",
      newWindow: function(e, cb) { // e can be an event or the callback. the callback (cb) is optional
        var current = counter;
        counter += 1;
        var arr = this.get('windowSlots');
        var host = this;
        return host.set('windowSlots.' + arr.length, current).then(function() {
          var wnds = host.findAllComponents('Window');
          var wnd = wnds[wnds.length - 1];
          host.set('windows.' + current, wnd);
          wnd.windowHost = host;
          wnd.parentNumber = current;
          wnd.set({
            'geometry.index': 1000 + wnds.length,
            'id': current
          });
          var step1 = function() {
            var mpr;
            if (!!cb && typeof(cb) === 'function') {
              try {
                mpr = cb(wnd);
                if (!!mpr && typeof mpr.then === 'function') return mpr;
              } catch (e1) { console.log(e1); }
            } else if (typeof(e) === 'function') {
              try {
                mpr = e(wnd);
                if (!!mpr && typeof mpr.then === 'function') pr = mpr;
              } catch (e2) { console.log(e2); }
            }
          };
          pr = step1();
          var step2 = function() {
            var mpr;
            wnd.move('cascade');
            try {
              mpr = wnd.loaded();
              if (!!mpr && typeof mpr.then === 'function') return mpr;
            } catch (e3) { console.log(e3); }
          };
          if (!!pr) pr = pr.then(step2); else pr = step2();
          var step3 = function() {
            var mpr;
            wnd.raise();
            return wnd.set('rendered', true).then(function() {
              wnd.element = document.getElementById('ractive-window-' + current);
              try {
                mpr = wnd.activated();
                if (!!mpr && typeof mpr.then === 'function') return mpr;
              } catch (e4) { console.log(e4); }
            });
          };
          if (!!pr) pr = pr.then(step3); else pr = step3();
          return pr;
        });
      },
      killWindow: function(wnd) {
        var blocks = this.get('blocks');
        var wnds = this.get('windows');
        if (!!wnds) {
          for (var w in wnds) {
            if (wnds[w] === wnd) delete wnds[w];
          }
        }
        var slots = this.get('windowSlots');
        if (!!slots) {
          slots.splice(slots.indexOf(wnd.parentNumber), 1);
        }
        for (var i in blocks) {
          var arr = blocks[i];
          if (!!arr && Array.isArray(arr) && arr.indexOf(wnd.parentNumber) >= 0) arr.splice(arr.indexOf(wnd.parentNumber), 1);
        }
        if (wnd === this.get('globalBlock')) this.set('globalBlock', null);
        this.unblockUnblockedWindows();
      },
      raiseWindow: function(wnd) {
        var wndso = this.get('windows');
        var slots = this.get('windowSlots');
        var blocks = this.get('blocks');
        var wnds = [];
        var target = this.topLevelBlockers(wnd);
        target.push(wnd);

        for (var k in wndso) if (target.indexOf(wndso[k]) < 0) wnds.push(wndso[k]);

        // put windows in existing order in an array
        wnds.sort(function(a, b) {
          var ai = a.get('geometry.index'), bi = b.get('geometry.index');
          if (ai < bi) return -1; else if (ai > bi) return 1; else return 0;
        });

        // add the window being raised to the end-o-the-queue
        if (!!wnd) wnds = wnds.concat(target);

        // move blocked windows to below their blocker with splice and indexOf
        function moveBeforeBlocker(wnd, blockers) {
          for (var i in blockers) {
            var bl = wndso[blockers[i]];
            var wi = wnds.indexOf(wnd), bi = wnds.indexOf(bl);
            if (!!!bl || wi < 0 || bi < 0) continue;

            // blocker must be moved first in case it too is blocked, so recursion required
            var arr = blocks[bl.parentNumber];
            if (!!!arr && Array.isArray(arr) && arr.length > 0) moveBeforeBlocker(bl, arr);
            if (wi > bi) {
              wnds.splice(wi, 1); // remove window
              wnds.splice(bi, 0, wnd); // pop it in before bl
            }
          }
        }

        var i;
        for (i in slots) {
          var arr = blocks[slots[i]];
          if (!!arr && Array.isArray(arr) && arr.length > 0) moveBeforeBlocker(wndso[slots[i]], arr);
        }

        // loop through array assigning indices
        for (i in wnds) {
          wnds[i].set('geometry.index', 1000 + (+i));
        }

        function globalBlocks(wnd) {
          var res = [];
          if (!!!wnd) return res;

          var arr = blocks[wnd.parentNumber];
          if (!!arr && Array.isArray(arr) && arr.length > 0) {
            for (var i in arr) {
              res = res.concat(globalBlocks(wndso[arr[i]]));
            }
          }

          res.push(wnd);

          return res;
        }

        // if globalBlock is set, add 10000 to it and all of its blockers
        var globals = globalBlocks(this.get('globalBlock'));
        for (i in globals) globals[i].add('geometry.index', 10000);
      },
      topLevelBlockers: function(wnd) {
        if (!!!wnd) return [];

        var blocks = this.get('blocks');
        var wndso = this.get('windows');
        var arr = blocks[wnd.parentNumber];
        var res = [];

        if (!!!arr || !Array.isArray(arr) || arr.length === 0) return res;

        for (var i in arr) {
          var arr2 = blocks[arr[i]];
          if (!!!arr2 || !Array.isArray(arr2) || arr2.length === 0) res.push(wndso[arr[i]]);
          else {
            res = res.concat(this.topLevelBlockers(wndso[arr[i]]));
          }
        }

        return res;
      },
      blockWindow: function(target, blocker /*, ...*/) {
        if (!!!target || !!!blocker) return;

        var blocks = this.get('blocks');
        var arr = blocks[target.parentNumber];
        if (!!!arr || !Array.isArray(arr)) arr = [];
        if (arr.indexOf(blocker.parentNumber) < 0) arr.push(blocker.parentNumber);
        blocks[target.parentNumber] = arr;
        for (var i = 2; i < arguments.length; i++) {
          if (arr.indexOf(arguments[i].parentNumber) < 0) arr.push(arguments[i].parentNumber);
        }
        if (arr.length > 0) target.set('blocked', true);
        this.raiseWindow();
      },
      unblockWindow: function(target, blocker /*, ...*/) {
        if (!!!target | !!!blocker) return;

        var blocks = this.get('blocks');
        var arr = blocks[target.parentNumber];
        if (!!!arr || !Array.isArray(arr)) return;
        if (arr.indexOf(blocker.parentNumber) >= 0) arr.splice(arr.indexOf(blocker.parentNumber), 1);
        for (var i = 2; i < arguments.length; i++) {
          if (arr.indexOf(arguments[i].parentNumber) >= 0) arr.splice(arr.indexOf(arguments[i].parentNumber), 1);
        }
        if (arr.length === 0) target.set('blocked', false);
        this.raiseWindow();
      },
      unblockUnblockedWindows: function() {
        var blocks = this.get('blocks');
        var wndso = this.get('windows');
        for (var i in blocks) {
          var arr = blocks[i];
          if (!!!arr || !Array.isArray(arr) || arr.length === 0) {
            var wnd = wndso[i];
            if (!!wnd) wnd.set('blocked', false);
          }
        }
      },
      messageBox: function(opts) {
        var args = arguments;
        var host = this;
        return new Ractive.Promise(function(y) {
          host.newWindow(function(w) {
            var message;
            if (args.length >= 2) {
              message = args[0];
              opts = args[1];
            } else if (args.length === 1 && typeof args[0] === 'string') {
              message = args[0];
              opts = {};
            }

            w.set('title', opts.title || 'Message');
            w.set('resizable', false);
            w.controls('close');
            w.content(message);
            var btns = opts.buttons || ['ok'], out = [];
            for (var i = 0; i < btns.length; i++) if (messageButtons.hasOwnProperty(btns[i])) out.push(messageButtons[btns[i]]);
            w.buttons(out);
            w.onClose = function() {
              this.kill();
              y(w.result || 'none');
            };
            if (!opts.hasOwnProperty('modal') || opts.modal) host.set('globalBlock', w);
            w.activated = function() { w.move('center'); };
          });
        });
      }
    });
  }();

  res.WindowHost = WindowHost;
})();
