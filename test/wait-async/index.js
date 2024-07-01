import {
  Atomics,
  Int32Array,
  SharedArrayBuffer,
  Worker,
} from '../../dist/main.js';

const w = new Worker('./worker.js', { type: 'module', no_serviceWorker: '../sw.js' });
const sb = new SharedArrayBuffer(4);
const view = new Int32Array(sb);

console.time('roundtrip');
w.postMessage({ some: 'value', view });

console.time('waitAsync');
Atomics.waitAsync(view, 0).value.then(result => {
  console.timeEnd('waitAsync');
  console.timeEnd('roundtrip');
  console.assert(view[0] === 1);
  document.body.textContent = result;
});
