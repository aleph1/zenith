import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

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
      typescript({
        compilerOptions: {
          target: 'es6'
        }
      })
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
      typescript({
        compilerOptions: {
          target: 'es6'
        }
      })
    ]
  },
  // production build minified
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/zenith.min.js',
      format: 'iife',
      name: 'z',
      preferConst: true
    },
    plugins: [
      replace({
        preventAssignment: true,
        DEBUG: false
      }),
      typescript({
        compilerOptions: {
          target: 'es6'
        }
      }),
      terser()
    ]
  },
];