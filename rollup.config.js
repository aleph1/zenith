import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

const banner = '/*! Zenith.js v' + process.env.npm_package_version + ' | MIT License | © 2022 Aleph1 Technologies Inc */';

export default [
  // debug build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/zenith.debug.js',
      format: 'iife',
      name: 'z',
      preferConst: true,
      banner
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
      preferConst: true,
      banner
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
      preferConst: true,
      banner
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
      terser({
        format: {
          comments: function (node, comment) {
            var text = comment.value;
            var type = comment.type;
            if (type == "comment2") {
              // multiline comment
              return /!|@preserve|@license|@cc_on/i.test(text);
            }
          },
        },
      })
    ]
  },
];