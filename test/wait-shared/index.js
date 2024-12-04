import {
  Atomics,
  Int32Array,
  SharedArrayBuffer,
  SharedWorker,
} from '../../dist/main.js';

const w = new SharedWorker('./shared-worker.js');
const sb = new SharedArrayBuffer(4);
const view = new Int32Array(sb);

console.time('roundtrip');
w.port.postMessage({ some: 'value', view });

console.time('waitAsync');
Atomics.waitAsync(view, 0).value.then(result => {
  console.timeEnd('waitAsync');
  console.timeEnd('roundtrip');
  console.assert(view[0] === 1);
  document.body.textContent = result;
  w.port.close();
});
