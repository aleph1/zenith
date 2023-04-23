# Zenith

Zenith is a tiny yet powerful reactive JavaScript framework that is under 2.5kb minified and gzipped, and 2kb minified and brotlified.

Its virtual dom and diffing algorithm function on an entire page or on specific nodes — especially useful in cases where you know that only a portion of the (v)dom tree will change. It allows for granular control over components that need to govern themselves and their own content, such as canvas, WebGL, or SVG. Additionally, it includes an opt-in object pool to minimize garbage collection.

Zenith is fast, flexible, fully tested, and doesn’t require a build step.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
  </head>
  <body>
    <main id="app"></main>
    <script src="https://unpkg.com/zenith"></script>
    <script>
      const counter = {
        value: 0,
        interval: null
      };
      const counter = 0;
      let counter
      const CounterDef = z.compDef({
        init: vNode => {
          counter.interval = setInterval(() => {
            counter++;
            vNode.redraw();
          }, 1000);
        }
        view: vNode => z.elem('div', z.text('Counter: ' + counter.value)),
        destroy: vNode => {
          clearInterval(counter.interval);
        }
      });
      z.draw(document.querySelector('#app'), z.comp(CounterDef));
    </script>
  </body>
</html>
```

## License

[MIT](LICENSE.md)