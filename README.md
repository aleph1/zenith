# Zenith

Zenith is a tiny yet powerful reactive JavaScript framework that is under 2.5kb minified and gzipped, and 2.25kb minified and brotlified.

Its virtual dom and diffing algorithm function on an entire page or on specific nodes — especially useful in cases where you know that only a portion of the (v)dom tree will change. It allows for granular control over components that need to govern themselves and their own content, such as canvas, WebGL, or SVG. Additionally, it includes an opt-in object pool to minimize garbage collection.

Zenith is fast, flexible, fully tested, and doesn’t require a build step. It wouldn’t exist without [Mithril.js](https://github.com/MithrilJS/mithril.js).

**The current release release is alpha, and depsite being used in production, it is still evolving.**

## Installation

TBC

## Additional Information

WIP: [Zenith site](https://aleph-1.com/zenith)

Documentation coming soon.

## Simple Use Case

```html
<!DOCTYPE html>
<html lang="en">
  <head>
  </head>
  <body>
    <main id="app"></main>
    <script src="https://unpkg.com/zenith"></script>
    <script>
      let counter = 0;
      const CounterDef = z.compDef({
        draw: vNode => z.elem('div', z.text(`Counter: {$counter}`)),
        tick: vNode => {
          counter++;
          vNode.redraw();
        }
      });
      z.mount(document.querySelector('#app'), z.comp(CounterDef));
    </script>
  </body>
</html>
```

## License

[MIT](LICENSE.md)
