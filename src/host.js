/* global Ractive */

import Window from "window";

var messageButtons = {
  ok: { label: 'OK', action: function() { this.result = 'ok'; this.close(); }, position: 'middle' },
  cancel: { label: 'Cancel', action: function() { this.result = 'cancel'; this.close(); }, position: 'middle' },
  yes: { label: 'Yes', action: function() { this.result = 'yes'; this.close(); }, position: 'middle' },
  no: { label: 'No', action: function() { this.result = 'no'; this.close(); }, position: 'middle' }
};

var WindowHost;
WindowHost = (function() {
  var counter = 0;

  // creates a window by appending to the slot array and retrieving the added window component
  // the callback is called first, if supplied
  // the window is then rendered and has its activate function called, if it has one
  // the window is then cascaded if it isn't already positioned
  function newWindow(e, cb) { // e can be an event or the callback. the callback (cb) is optional
    var current = counter;
    counter += 1;
    var host = this;
    return host.push('windowSlots', current).then(function() {
      var pr;

      // find the window instance let it know who it is
      var wnds = host.findAllComponents('Window');
      var wnd = wnds[wnds.length - 1];

      host.set('windows.' + current, wnd);
      wnd.parentNumber = current;
      wnd.set({
        'geometry.index': 1000 + wnds.length,
        'geometry.left': -9999,
        'geometry.top': -9999,
        'id': current
      });

      // call the creation callback if given
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

      // render the window and call its activate function
      var step2 = function() {
        var mpr;
        wnd.raise();
        return wnd.set('_wnd_rendered', true).then(function() {
          wnd.element = wnd.find('.ractive-window');
          try {
            mpr = wnd.activated();
            if (!!mpr && typeof mpr.then === 'function') return mpr;
          } catch (e4) { console.log(e4); }
        });
      };
      if (!!pr) pr = pr.then(step2); else pr = step2();

      // move the window from initial offscreen coordinates
      var step3 = function() {
        var mpr;
        if (wnd.get('geometry.left') === -9999) {
          wnd.move('cascade');
        }
      };
      if (!!pr) pr = pr.then(step3); else pr = step3();

      // return a promise for the last steps completion
      return pr;
    });
  }

  // shows a centered modal messagebox
  function messageBox(opts) {
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
    newWindow: newWindow,
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
        this.splice('windowSlots', slots.indexOf(wnd.parentNumber), 1);
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
    messageBox: messageBox
  });
})();

export default WindowHost;
