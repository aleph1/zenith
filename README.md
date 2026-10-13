# Zenith

Zenith is a tiny reactive JavaScript framework with a virtual DOM, keyed reconciliation, and targeted component redraws. Its rendering model can update an entire application or a specific component, which is useful when parts of a page manage their own content, such as canvas, WebGL, and SVG interfaces.

Zenith supports component lifecycle hooks, memoization, DOM events, SVG and MathML, and optional helpers. It is inspired by [Mithril.js](https://github.com/MithrilJS/mithril.js).

**Status:** Zenith is currently in beta. We aim to keep the API stable through 1.0.0, but breaking changes may still occur during the beta period.

## Installation

Install the beta package:

```sh
npm install zenith@beta
```

Import the functions you need:

```js
import { bind, comp, compDef, elem } from 'zenith';
```

Prebuilt browser files are also included in `dist/`. The `zenith.global.js` build is intended for direct browser use; the `zenith.js` build is an ES module.

## Example: counter

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Zenith counter</title>
  </head>
  <body>
    <main id="app"></main>
    <script type="module">
      import { bind, comp, compDef, elem } from 'zenith';

      let count = 0;

      const Counter = compDef({
        draw: () => elem('button', {
          onclick: () => { count++; }
        }, `Count: ${count}`)
      });

      bind(document.querySelector('#app'), comp(Counter));
    </script>
  </body>
</html>
```

The example assumes an environment that resolves npm package imports, such as a bundler or development server. Event handlers automatically schedule a redraw unless the event's `draw` property is set to `false`.

## Components and redraws

Create components with `compDef()` and `comp()`, then mount them using `bind()`. Call `draw()` when external state changes outside an event handler:

```js
import { bind, comp, compDef, draw, elem } from 'zenith';

let message = 'Hello';

const Message = compDef({
  draw: () => elem('p', message)
});

const view = comp(Message);
bind(document.querySelector('#app'), view);

message = 'Updated';
draw(view);
```

Redraws are scheduled in a microtask. Call `sync()` if you need to apply queued redraws immediately. `draw(view, true)` requests a targeted redraw of a component.

Component definitions can use `init`, `draw`, `drawn`, `remove`, and `removed` lifecycle hooks. `remove` may return a Promise to defer removal. Components also support optional memoization through `$memo`.

## Package builds

The npm package includes prebuilt files under `dist/`, including:

- `zenith.js` — ES module
- `zenith.global.js` — global browser build
- `zenith.development.js` — development build
- `zenith-helpers.js` — optional helpers (import from `zenith/helpers`)

The library is designed for a very small compressed footprint; actual size depends on the build and compression settings.

## Documentation

Additional information: [Zenith website](https://aleph-1.com/zenith) (work in progress).

Report bugs and request features through [GitHub Issues](https://github.com/aleph1/Zenith/issues).

## License

[MIT](LICENSE)