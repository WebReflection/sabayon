import {
  Atomics,
  Int32Array,
  SharedArrayBuffer,
  postMessage,
} from '../../src/worker.js';

const sb = new SharedArrayBuffer(4);
const view = new Int32Array(sb);

postMessage({ some: 'value', view });

Atomics.wait(view, 0);

console.assert(view[0] === 1);
postMessage('ok');
