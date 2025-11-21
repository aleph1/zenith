import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const banner = '/*! Zenith v' + process.env.npm_package_version + ' | MIT License | © 2022 Aleph1 Technologies Inc */';

export default [
  // debug build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/zenith.debug.js',
      format: 'iife',
      name: 'z',
      extend: true,
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
      compact: true,
      extend: true,
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
        compress: {
          inline: 3,
          passes: 10,  // More passes for better optimization
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          unsafe_math: true,
          unsafe_proto: true,  // Add this
          unsafe_methods: true,  // Add this
          unsafe_arrows: true,  // Add this
          drop_debugger: true,
          drop_console: false,
          collapse_vars: true,  // Add this
          reduce_vars: true,  // Add this
          reduce_funcs: true,  // Add this
          loops: true,  // Add this
          dead_code: true,  // Add this
          conditionals: true,  // Add this
          evaluate: true,  // Add this
          booleans: true,  // Add this
          typeofs: true,  // Add this
          sequences: true,  // Add this
          side_effects: true,  // Add this
          join_vars: true,  // Add this
        },
        mangle: {
          properties: false,
          toplevel: true,  // Add this - mangle top-level variable names
        },
        format: {
          comments: /^!/,
        },
      }),
      replace({
        preventAssignment: false,
        delimiters: ['', ''],
        'this.z=': 'window.z=',
      })
    ]
  }
];