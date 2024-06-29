import {
  Atomics,
  Worker,
} from '../../worker-main/main.js';

const w = new Worker('./worker.js', { type: 'module' });

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
