import {
  Atomics,
  Int32Array,
  SharedArrayBuffer,
  postMessage,
} from '../../src/worker.js';

const sb = new SharedArrayBuffer(4);
const view = new Int32Array(sb);

console.time('roundtrip');
postMessage({ some: 'value', view });

console.time('waitAsync');
Atomics.waitAsync(view, 0).value.then(result => {
  console.timeEnd('waitAsync');
  console.timeEnd('roundtrip');
  console.assert(view[0] === 1);
  postMessage(result);
});
