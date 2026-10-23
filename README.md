# Zenith

Zenith is a tiny JavaScript virtual DOM framework with keyed reconciliation and targeted component redraws. Its rendering model can update an entire application or a specific component, making it easy to integrate independently managed content such as canvas, WebGL, and SVG interfaces.

Zenith supports component lifecycle hooks, memoization, DOM events, SVG and MathML, and optional helpers. It is inspired by [Mithril.js](https://github.com/MithrilJS/mithril.js).

**Status:** Zenith 1.0.0 is currently in release candidate. The API is expected to remain stable through the final 1.0 release, with changes focused primarily on bug fixes.

## Installation

Install the release candidate:

```sh
npm install zenith@rc
```

Import the functions you need:

```js
import { bind, comp, compDef, elem } from 'zenith';
```

Prebuilt browser files are also included in `dist/`. The `zenith.js` build is an ES module, while `zenith.global.js` exposes the Zenith API through window.z for direct browser use.

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

The example assumes an environment that resolves npm package imports, such as a bundler or development server. Event handlers automatically schedule a redraw unless the event's `redraw` property is set to `false`.

## Components and redraws

Create components with `compDef()` and `comp()`, then mount them using `bind()`. Call `redraw()` when application state changes outside an event handler:

```js
import { bind, comp, compDef, redraw, elem } from 'zenith';

let message = 'Hello';

const Message = compDef({
  draw: () => elem('p', message)
});

const view = comp(Message);
bind(document.querySelector('#app'), view);

message = 'Updated';
redraw(view);
```

Redraws are batched and scheduled in a microtask. Call `sync()` to apply queued redraws immediately. Use `redraw(view, true)` to redraw only the specified component subtree.

Component definitions support `init`, `draw`, `drawn`, `remove`, and `removed` lifecycle hooks. The `remove` hook may return a Promise to defer removal; deferred removal requires keyed components. Components also support optional memoization through `$memo`.

Zenith does not manage application state or automatically track dependencies. State can be stored and updated using ordinary JavaScript, external state managers, or optional helpers.

## Package builds

The npm package includes prebuilt files under `dist/`, including:

- `zenith.js` — ES module
- `zenith.global.js` — browser build exposing window.z
- `zenith.development.js` — development build
- `zenith-helpers.js` — optional helpers (import from `zenith/helpers`)

The library is designed for a very small compressed footprint; actual size depends on the build and compression settings.

## Documentation

Additional information: [Zenith website](https://aleph-1.com/zenith).

Report bugs and request features through [GitHub Issues](https://github.com/aleph1/Zenith/issues).

## License

[MIT](LICENSE)