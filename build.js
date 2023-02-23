const rollup = require('rollup').rollup;
const replace = require('@rollup/plugin-replace');

// DEBUG BUILD
rollup({
  input: 'src/index.js',
  plugins: [
    replace({
      preventAssignment: true,
      DEBUG: 'true'
    })
  ]
}).then( bundle => {
  bundle.write({
    file: 'dist/zenith.debug.js',
    format: 'iife',
    name: 'z'
  })
});

// PRODUCTION BUILD
rollup({
  input: 'src/index.js',
  plugins: [
    replace({
    	preventAssignment: true,
      DEBUG: 'false'
    })
  ]
}).then( bundle => {
  bundle.write({
    file: 'dist/zenith.js',
    format: 'iife',
    name: 'z'
  })
});