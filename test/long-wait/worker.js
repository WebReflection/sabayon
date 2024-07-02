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

console.time('wait');
Atomics.wait(view, 0);
console.timeEnd('wait');
console.timeEnd('roundtrip');

console.assert(view[0] === 1);
postMessage('ok');
