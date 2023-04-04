import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';

const banner = '/*! Zenith v' + process.env.npm_package_version + ' | MIT License | © 2022 Aleph1 Technologies Inc */';

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
  }
];