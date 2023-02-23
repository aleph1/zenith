import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';

export default [
  // debug build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/zenith.debug.js',
      format: 'iife',
      name: 'z',
      preferConst: true
    },
    plugins: [
      replace({
        preventAssignment: true,
        DEBUG: true
      }),
      typescript()
    ]
  },
  // production build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/zenith.js',
      format: 'iife',
      name: 'z',
      preferConst: true
    },
    plugins: [
      replace({
        preventAssignment: true,
        DEBUG: false
      }),
      typescript()
    ]
  }
];