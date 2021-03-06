## 0.12.1

* Update default style.

## 0.12.0

* Adds support for template content in button labels and window titles.
* Adjusts handling of topmost windows.
* __BUG?:__ Keeps buttons on the bottom of maximized fixed windows.

## 0.11.0

* Adds support for having a single designated topmost window.
* Adds support for more easily colored titlebars.
* __BUG:__ Fixes resizing support in IE, which apparently likes *really* precise mouse coordinates.

## 0.10.2

* __BUG:__ Prevent text selection while dragging to resize or move windows.

## 0.10.1

* __BUG:__ Don't try to resize windows that aren't yet rendered using non-px sizes.

## 0.10.0

* Allow `resize` to be called with CSS units using dirty tricks.

## 0.9.1

* __BUG:__ Make sure windows that start out maximized restore to a visible position.

## 0.9.0

* Better default maximization styling using the newly added `maximized` window class.
* Internal events are now prefixed with `_` to make way for...
* There are now events for when a window title (retitle) changes, when the window state changes (maximize, minimize, restore), and when a window is closed (close).
* `WindowHost` may now have content, which it will just `{{yield}}`.

## 0.8.1

* __BUG?:__ `window.move` now returns a Promise.
* __BUG?:__ The Promise returned from `host.newWindow` will now resolve with the new window instead of `undefined`.

## 0.8.0

* Switched to gobble for bulding, and code is consequently ES6ified.
* Window creation process has been refactor to be slightly less wacky.

## 0.7.0

* Adds initial support for touch when moving and resizing windows.
* Adds support for button class at the window level.

## 0.6.0

* Changes the window render variable name to avoid clashes with more complex contents.
* Adds an afterClose promise that is resolved when a window is killed.
* Moves the example into its own directory and provides pre-built files.

## 0.5.0

* Window load callbacks that return promises are now chained with the promise returned from newWindow.
* Window and content div styles and classes can be added to the window model.

## 0.4.1

* __BUG:__ Fixes issue with leaky context and shared component state.

## 0.4.0

* Adds an element property to each window that references its actual DOM host.
* Adds a ractive window id.
* Changes template references to be relative to the current context.
* Makes cascade eventually wrap back to starting position instead of angling down-right forever.

## 0.3.0

* Adds initial support for cascade positioning.
* Fixes some minor css issues regarding fixed sized windows.
* Adds a few common attribute setters like title and resizable.

## 0.2.0

* Expands support for modal windows
* Adds support for dialog buttons
* Adds an initial message box helper
* Adds an initial relative position helper i.e. move('center')
* Adds support for fixed dialogs that size to fit their content
