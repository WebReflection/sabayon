import {
  Atomics,
  Worker,
} from '../../src/main.js';

// usage of `serviceWorker` option is mandatory to enable
// the sync-blocking `Atomics.wait` in workers
const options = { type: 'module', serviceWorker: '../sw.js' };

const w = new Worker('./worker.js', options);

w.addEventListener('message', event => {
  const { data } = event;
  if (typeof data === 'string')
    document.body.textContent = data;
  else {
    console.log('this is going to be legen ...');
    setTimeout(() => {
      console.log('... dary!');
      console.log('Main', data);
      data.view[0] = 1;
      Atomics.notify(data.view, 0);
    }, 3000);
  }
});
