import { notify } from '../../main-worker/worker.js';

addEventListener('message', event => {
  const { data } = event;
  console.log('Worker', data);
  data.view[0] = 1;
  notify(data.view, 0);
});
