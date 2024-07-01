import {
  Atomics,
  addEventListener,
 } from '../../dist/worker.js';

addEventListener('message', event => {
  const { data } = event;
  console.log('Worker', data);
  data.view[0] = 1;
  Atomics.notify(data.view, 0);
});
