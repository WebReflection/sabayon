import {nodeResolve} from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default [
  {
    input: './src/main.js',
    plugins: [nodeResolve()].concat(process.env.NO_MIN ? [] : [terser()]),
    output: {
      esModule: true,
      file: './dist/main.js',
    }
  },
  {
    input: './src/sw-listeners.js',
    plugins: [nodeResolve()].concat(process.env.NO_MIN ? [] : [terser()]),
    output: {
      esModule: true,
      file: './dist/sw-listeners.js',
    }
  },
  {
    input: './src/sw.js',
    plugins: [nodeResolve()].concat(process.env.NO_MIN ? [] : [terser()]),
    output: {
      esModule: true,
      file: './dist/sw.js',
    }
  },
  {
    input: './src/worker.js',
    plugins: [nodeResolve()].concat(process.env.NO_MIN ? [] : [terser()]),
    output: {
      esModule: true,
      file: './dist/worker.js',
    }
  },
];
