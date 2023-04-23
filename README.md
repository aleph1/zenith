# _Zenith.js_

Zenith.js is a minimal view layer for building web interfaces. It is designed to be simple to use, while integrating with 3rd party libraries for state management and routing.

Here’s the first example to get you started. As you can see there is no build step required.

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