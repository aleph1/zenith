import replace from '@rollup/plugin-replace';
import esbuild from 'rollup-plugin-esbuild';
import terser from '@rollup/plugin-terser';

const banner = '/*! Zenith v' + process.env.npm_package_version + ' | MIT License | © 2022-2025 Daniel Barber */';
const reservedExports = ['elem', 'node', 'comp', 'mount', 'draw', 'sync', 'ns', 'elemType', 'nodeType', 'compType', 'textType'];

export default [
  // ESM debug build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/zenith.development.js',
      format: 'esm',
      banner
    },
    plugins: [
      replace({
        preventAssignment: true,
        DEBUG: true
      }),
      esbuild({
        target: 'es6'
      })
    ]
  },
  
  // ESM production build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/zenith.js',
      format: 'esm',
      compact: true,
      banner
    },
    plugins: [
      replace({
        preventAssignment: true,
        DEBUG: false
      }),
      esbuild({
        target: 'es6'
      }),
      terser({
        compress: {
          inline: 3,
          passes: 10,
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          unsafe_math: true,
          unsafe_proto: true,
          unsafe_methods: true,
          unsafe_arrows: true,
          drop_debugger: true,
          drop_console: false,
          collapse_vars: true,
          reduce_vars: true,
          reduce_funcs: true,
          loops: true,
          dead_code: true,
          conditionals: true,
          evaluate: true,
          booleans: true,
          typeofs: true,
          sequences: true,
          side_effects: true,
          join_vars: true,
        },
        mangle: {
          properties: false,
          toplevel: true,
          reserved: reservedExports,
        },
        format: {
          comments: /^!/,
        },
      })
    ]
  },
  
  // IIFE build for direct browser usage
  {
    input: 'src/index.iife.ts',  // Different entry point
    output: {
      file: 'dist/zenith.global.js',
      format: 'es',
      extend: true,
      exports: 'none',
      banner
    },
    plugins: [
      replace({
        preventAssignment: true,
        DEBUG: false
      }),
      esbuild({
        target: 'es6'
      }),
      terser({
        compress: {
          inline: 3,
          passes: 10,
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          unsafe_math: true,
          unsafe_proto: true,
          unsafe_methods: true,
          unsafe_arrows: true,
          drop_debugger: true,
          drop_console: false,
          collapse_vars: true,
          reduce_vars: true,
          reduce_funcs: true,
          loops: true,
          dead_code: true,
          conditionals: true,
          evaluate: true,
          booleans: true,
          typeofs: true,
          sequences: true,
          side_effects: true,
          join_vars: true,
        },
        mangle: {
          properties: false,
          toplevel: false,
          reserved: reservedExports,
        },
        format: {
          comments: /^!/,
        },
      }),
      replace({
        preventAssignment: false,
        delimiters: ['', ''],
        'var z=': 'window.z=',
      })
    ]
  }
];