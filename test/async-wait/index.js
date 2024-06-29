import {
  Worker,
  notify,
} from '../../worker-main/main.js';

const w = new Worker('./worker.js', { type: 'module' });
w.addEventListener('message', event => {
  const { data } = event;
  if (typeof data === 'string')
    document.body.textContent = 'ok';
  else {
    console.log('Main', data);
    data.view[0] = 1;
    notify(data.view, 0);
  }
});
