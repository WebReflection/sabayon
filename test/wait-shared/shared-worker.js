import { Atomics } from '../../dist/shared-worker.js';

addEventListener('connect', ({ ports }) => {
  for (const port of ports) {
    port.addEventListener('message', ({ data }) => {
      data.view[0] = 1;
      Atomics.notify(data.view, 0);
    });
  }
});
