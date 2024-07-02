import {
  Atomics,
  addEventListener,
 } from '../../dist/worker.js';

addEventListener('message', event => {
  const { data } = event;
  console.log('this is going to be legen ...');
  setTimeout(() => {
    console.log('... dary!');
    console.log('Worker', data);
    data.view[0] = 1;
    Atomics.notify(data.view, 0);
  }, 3000);
});
