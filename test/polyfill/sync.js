console.time('main bootstrap');
import sabayon from '../../dist/polyfill.js';
await sabayon('../sw-polyfill.js');
console.timeEnd('main bootstrap');

const w = new Worker('./wsync.js', { type: 'module' });

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

const channel = new MessageChannel;
w.postMessage('ok', [channel.port2]);

channel.port1.onmessage = event => {
  const { data } = event;
  console.log('Channel', data);
  data.view[0] = 1;
  Atomics.notify(data.view, 0);
};
