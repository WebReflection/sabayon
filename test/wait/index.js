import {
  Int32Array,
  SharedArrayBuffer,
  Worker,
  waitAsync,
  notify,
} from '../../esm/main.js';

const w = new Worker('./worker.js', { type: 'module', serviceWorker: './sw.js' });

w.addEventListener('message', event => {
  event.data[0] = 1;
  notify(event.data, 0);
});

