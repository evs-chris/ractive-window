var Ractive = require('ractivejs~ractive@dev');
var wnds = require('ractive-window');

var ractive = new Ractive({
  components: wnds,
  el: 'container',
  template: '<button on-click="mkWnd">New Window</button><button on-click="message">MessageBox</button><button on-click="fixed">New Fixed Window</button><WindowHost />'
});

var host = ractive.findComponent('WindowHost');
host.set('buttonClass', 'dlg-button');

ractive.on('mkWnd', function(e) {
  host.newWindow(function(w) {
    w.set({ title: 'Window ' + w.parentNumber, 'geometry.width': 375, 'geometry.height': 230 });
    w.buttons(
      { label: 'To the Left', position: 'left', buttonClass: 'what-button', action: function() { this.result = 'left'; console.log('left clicked'); } },
      { label: 'Default Right', action: function() { this.result = 'right'; console.log('right clicked'); } },
      { label: 'Also Center', position: 'middle', action: function() { this.result = 'middle'; console.log('center clicked'); } }
    );
    w.content('lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>');
    w.afterClose.then(function(res) { console.log('after close with result', res); });
  });
});
ractive.on('message', function(e) { host.messageBox('Watch the console for return type.', { buttons: ['ok', 'cancel'], title: 'Configurable' }).then(function(m) { console.log(m); }); });
ractive.on('fixed', function(e) {
  host.newWindow(function(w) {
    w.resizable(false);
    w.content('lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>lalalalalalalalalala<br/>');
    w.title('I fit my content...');
  });
});