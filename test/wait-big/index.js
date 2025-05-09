import {
  Atomics,
  Worker,
} from '../../dist/main.js';

// usage of `serviceWorker` option is mandatory to enable
// the sync-blocking `Atomics.wait` in workers
const options = { type: 'module', serviceWorker: '../sw.js' };

const w = new Worker('./worker.js', options);

w.addEventListener('message', event => {
  const { data } = event;
  if (typeof data === 'string')
    document.body.textContent = data;
  else {
    console.log('Main', data);
    data.view[0] = 9007199254740993n;
    Atomics.notify(data.view, 0);
  }
});
