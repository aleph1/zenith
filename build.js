const rollup = require('rollup').rollup;

rollup({
  input: 'src/index.js'
}).then( bundle => {
  bundle.write({
    file: 'dist/zenith.js',
    format: 'iife',
    name: 'z'
  })
});