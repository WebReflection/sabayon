import {
  Atomics,
  Int32Array,
  SharedArrayBuffer,
  Worker,
} from '../../worker-main/main.js';

const w = new Worker('./worker.js', { type: 'module' });
const sb = new SharedArrayBuffer(4);
const view = new Int32Array(sb);

w.postMessage({ some: 'value', view });

Atomics.waitAsync(view, 0).value.then(result => {
  console.assert(view[0] === 1);
  document.body.textContent = result;
});
