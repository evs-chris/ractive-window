# Ractive Window

jQueryUI Dialog-like windowing built on [Ractive](https://github.com/ractivejs/ractive)

## Where to get it?

Racive Window is available as a [giblet](https://github.com/evs-chris/gobble-giblet), a [component](https://github.com/componentjs/component), and a pre-assembled UMD module. Each flavor does not declare an explicit dependency on Ractive, but it is expected to be available as a global.

All of the pre-built files live in tags on the build branch.

### Development

Ractive Window uses [gobble](https://github.com/gobblejs/gobble) as its build tool, which makes it easy to build and play around with. The default mode in the gobble file is `development`, which will automatically pull in the edge version of Ractive and make it available along with the sandbox. There is an example file provided along with the source, which you can access by running gobble and pointing you browser at http://localhost:4567/sandbox/example.html.

## Usage

Ractive Window is a little bit weird as a Ractive component, because it's mostly built to be assembled dynamically rather than in pre-defined templates. What you get is a `Host` component, which manages a number of `Window` components. There is currently no way to manage windows in the template; all of the API is on the JS-side.

```html
<ractive-container/>
```

```js
// import RactiveWindow and Ractive using whatever module system first
Ractive.components.Host = RactiveWindow.Host;

var ractive = new Ractive({
  el: 'ractive-container',
  template: '<Host/>'
});

var host = ractive.findComponent('Host');
```

### Host

#### `host.newWindow(callback)`

`host.newWindow()` creates a new `Window` instance, assigns it a number, and returns a promise that resolves with the new instance. If a callback is supplied, it is called with instance just after the instance is created. The callback may return a promise, which is inserted into the init chain.

After the callback, the component's `activate` function is called (defaults to a no-op). If `activate` returns a promise, it is inserted into the init chain.

After `activate`, the window is moved to its displayed coordinates, which defaults to a sort of cascade positioning. If any coordinates were set in the init callback or `activate`, those will be used instead.

*TODO* `blockWindow`, `unblockWindow`, `raiseWindow`

### Window

Windows are composed of a number of partials that control appearance and content.

* title - the content of the title bar
* controls - the title bar control buttons
* body - the content of the window
* buttons - any dialog buttons
* foot - the status bar area

There are helpers to update each partial.

#### `window.content(tpl)`

This method resets the body partial of the window using the supplied template, which may be a string, pre-parsed template, or template function. The initial call to this method should probably be in the `newWindow()` init callback or window `activate` function.

#### `window.resize(width, height)`

This method resizes the window to the specified width and height. If the parameters are integers or strings with `px` units, then they will be used directly. If a unit other than `px` is used, each dimension is set to its given value and then reset to its corresponding pixel value, which is retrieved with `clientWidth` or `clientHeight`.

*TODO* `move()`, `title()`, `resizable()`, `minimize()`, `maximize()`, `restore()`, `raise()`, `kill()`, `buttons()`, `button()`, `close()`, `controls()`

### Window Events

Since events in Ractive components bubble up the hierarchy to the root, you can install handlers at the root for window events. You can use a wildcard event path or the component name, which will typically be `Window`. Be careful with wildcard events, especially with common names like `close`.
```js
// just components named Window
ractive.on('Window.close', (wnd) => doSomething());

// any component close event
ractive.on('*.close', (wnd) => doSomething());
```

* `close` - `listener(window)` - fires just before a window is torn down. If the window aborts closing from its handler, this will not be fired.
* `retitle` - `listener(title, window)` - fires when the window title changes. The first time it fires (first render), the title will be undefined.
* `maximize` - `listener(state, window)` - fires when the window is maximized.
* `minimize` - `listener(state, window)` - fires when the window is minimized.
* `restore` - `listener(state, window)` - fires when the window is restored.

States are defined as
```json
{
  "normal": 0,
  "minimized": 1,
  "maximized": 2
}
```

## License

Copyright (c) 2014 Chris Reeves. Released under an [MIT license](https://github.com/evs-chris/ractive-window/blob/master/LICENSE.md).
