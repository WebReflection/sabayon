import {
  Atomics,
  Worker,
} from '../../dist/main.js';

const options = { type: 'module' };

// optionally test via ServiceWorker too
// due different bootstrap time
if (location.search === '?sw')
  options.serviceWorker = '../sw.js';

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
