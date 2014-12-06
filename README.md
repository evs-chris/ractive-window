# Ractive Window

jQueryUI Dialog-like windowing built on [Ractive](https://github.com/ractivejs/ractive)

## Where to get it?

Racive Window is available as a [giblet](https://github.com/evs-chris/gobble-giblet), a [component](https://github.com/componentjs/component), and a pre-assembled UMD module. Each flavor does not declare an explici dependency on Ractive, but it is expected to be available as a global.

All of the pre-build files live in tags on the build branch.

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

After the callback, the component's `activate` function is called (defaults to a no-op). If `activate` returns a promise, it is insreted into the init chain.

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

#### `window.content()`

This method resets the body partial of the window using the supplied template, which may be a string, pre-parsed template, or template function. The initial call to this method should probably be in the `newWindow()` init callback or window `activate` function.

*TODO* `move()`, `resize()`, `title()`, `resizable()`, `minimize()`, `maximize()`, `restore()`, `raise()`, `kill()`, `buttons()`, `button()`, `close()`, `controls()`

## License

Copyright (c) 2014 Chris Reeves. Released under an [MIT license](https://github.com/evs-chris/ractive-window/blob/master/LICENSE.md).
