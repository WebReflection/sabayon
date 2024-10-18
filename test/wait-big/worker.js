import {
  Atomics,
  BigInt64Array,
  SharedArrayBuffer,
  postMessage,
} from '../../dist/worker.js';

const sb = new SharedArrayBuffer(8);
const view = new BigInt64Array(sb);

console.time('roundtrip');
postMessage({ some: 'value', view });

console.time('wait');
Atomics.wait(view, 0);
console.timeEnd('wait');
console.timeEnd('roundtrip');

console.log(view[0]);
console.assert(view[0] === 9007199254740993n);
postMessage('ok');
