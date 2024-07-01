import {
  Atomics,
  Int32Array,
  SharedArrayBuffer,
  postMessage,
} from '../../src/worker.js';

const sb = new SharedArrayBuffer(4);
const view = new Int32Array(sb);

postMessage({ some: 'value', view });

Atomics.waitAsync(view, 0).value.then(result => {
  console.assert(view[0] === 1);
  postMessage(result);
});
