const rollup = require('rollup').rollup;
const replace = require('@rollup/plugin-replace');
const typescript = require('@rollup/plugin-typescript');

// DEBUG BUILD
rollup({
  input: 'src/index.ts',
  plugins: [
    replace({
      preventAssignment: true,
      DEBUG: 'true'
    },
    typescript())
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
  input: 'src/index.ts',
  plugins: [
    replace({
    	preventAssignment: true,
      DEBUG: 'false'
    },
    typescript())
  ]
}).then( bundle => {
  bundle.write({
    file: 'dist/zenith.js',
    format: 'iife',
    name: 'z'
  })
});