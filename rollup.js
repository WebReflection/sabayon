import {nodeResolve} from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

// import { writeFileSync } from 'fs';
// writeFileSync('./src/polyfill/bid.js', `// ⚠️ AUTOMATED ⚠️\nexport default '${crypto.randomUUID()}';\n`);

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
  {
    input: './src/lite/main.js',
    plugins: [nodeResolve()].concat(process.env.NO_MIN ? [] : [terser()]),
    output: {
      esModule: true,
      file: './dist/lite/main.js',
    }
  },
  {
    input: './src/lite/sab.js',
    plugins: [nodeResolve()].concat(process.env.NO_MIN ? [] : [terser()]),
    output: {
      esModule: true,
      file: './dist/lite/sab.js',
    }
  },
  {
    input: './src/lite/worker.js',
    plugins: [nodeResolve()].concat(process.env.NO_MIN ? [] : [terser()]),
    output: {
      esModule: true,
      file: './dist/lite/worker.js',
    }
  },
  {
    input: './src/lite/utils/shared.js',
    plugins: [nodeResolve()].concat(process.env.NO_MIN ? [] : [terser()]),
    output: {
      esModule: true,
      file: './dist/lite/utils.js',
    }
  },
  {
    input: './src/polyfill/index.js',
    plugins: [nodeResolve()].concat(process.env.NO_MIN ? [] : [terser()]),
    output: {
      esModule: true,
      dir: './dist/',
    }
  },
  {
    input: './src/polyfill/sw.js',
    plugins: [nodeResolve()].concat(process.env.NO_MIN ? [] : [terser()]),
    output: {
      esModule: true,
      file: './dist/polyfill-sw.js',
    }
  },
];
