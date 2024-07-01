import {
  Atomics,
  Worker,
} from '../../dist/main.js';

const w = new Worker('./worker.js', { type: 'module', serviceWorker: '../sw.js' });

w.addEventListener('message', event => {
  const { data } = event;
  if (typeof data === 'string')
    document.body.textContent = data;
  else {
    console.log('Main', data);
    data.view[0] = 1;
    Atomics.notify(data.view, 0);
  }
});
