import replace from '@rollup/plugin-replace';
import esbuild from 'rollup-plugin-esbuild';
import terser from '@rollup/plugin-terser';

const version = process.env.npm_package_version;
const copyright = `| MIT License | © 2022-2025 Daniel Barber */`;
const zenithBanner = `/*! Zenith v${version} ${copyright}`;
const helpersBanner = `/*! Zenith Helpers v${version} ${copyright}`;

const reservedExports = ['elem', 'comp', 'node', 'compDef', 'bind', 'draw', 'sync', 'ns', 'diff'];
const reservedHelpers = ['keep', 'is', 'cls', 'slot', 'html', 'closest', 'inject', 'signal', 'derived', 'router', 'Portal'];

const compress = {
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
};

const esbuildPlugin = esbuild({ target: 'es2018' });

export default [
  // ESM debug build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/zenith.development.js',
      format: 'esm',
      banner: zenithBanner
    },
    plugins: [
      replace({ preventAssignment: true, DEBUG: true }),
      esbuildPlugin
    ]
  },

  // ESM production build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/zenith.js',
      format: 'esm',
      compact: true,
      banner: zenithBanner
    },
    plugins: [
      replace({ preventAssignment: true, DEBUG: false }),
      esbuildPlugin,
      terser({
        compress,
        mangle: { properties: false, toplevel: true, reserved: reservedExports },
        format: { comments: /^!/ },
      })
    ]
  },

  // IIFE build for direct browser usage
  {
    input: 'src/index.iife.ts',
    output: {
      file: 'dist/zenith.global.js',
      format: 'es',
      extend: true,
      exports: 'none',
      banner: zenithBanner
    },
    plugins: [
      replace({ preventAssignment: true, DEBUG: false }),
      esbuildPlugin,
      terser({
        compress,
        mangle: { properties: false, toplevel: false, reserved: reservedExports },
        format: { comments: /^!/ },
      }),
      replace({
        preventAssignment: false,
        delimiters: ['', ''],
        'var z=': 'window.z=',
      })
    ]
  },

  // Helpers ESM debug build
  {
    input: 'src/helpers/index.ts',
    external: ['zenith'],
    output: {
      file: 'dist/zenith-helpers.development.js',
      format: 'esm',
      banner: helpersBanner,
      paths: { zenith: './zenith.js' }
    },
    plugins: [
      replace({ preventAssignment: true, DEBUG: true }),
      esbuildPlugin
    ]
  },

  // Helpers ESM production build
  {
    input: 'src/helpers/index.ts',
    external: ['zenith'],
    output: {
      file: 'dist/zenith-helpers.js',
      format: 'esm',
      compact: true,
      banner: helpersBanner,
      paths: { zenith: './zenith.js' }
    },
    plugins: [
      replace({ preventAssignment: true, DEBUG: false }),
      esbuildPlugin,
      terser({
        compress,
        mangle: { properties: false, toplevel: true, reserved: reservedHelpers },
        format: { comments: /^!/ },
      })
    ]
  },

  // Helpers IIFE build
  {
    input: 'src/helpers/index.iife.ts',
    external: ['zenith'],
    output: {
      file: 'dist/zenith-helpers.global.js',
      format: 'iife',
      name: 'zh',
      globals: { zenith: 'z' },
      banner: helpersBanner
    },
    plugins: [
      replace({ preventAssignment: true, DEBUG: false }),
      esbuildPlugin,
      terser({
        compress,
        mangle: { properties: false, toplevel: false, reserved: reservedHelpers },
        format: { comments: /^!/ },
      })
    ]
  }
];