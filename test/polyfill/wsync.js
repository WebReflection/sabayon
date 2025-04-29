console.time('worker bootstrap');
import sabayon from '../../dist/polyfill.js';
await sabayon();
console.timeEnd('worker bootstrap');

const sb = new SharedArrayBuffer(4);
const view = new Int32Array(sb);

const test = self => {
  view[0] = 0;

  console.time('roundtrip');
  self.postMessage({ some: 'value', view });

  console.time('wait');
  Atomics.wait(view, 0);
  console.timeEnd('wait');
  console.timeEnd('roundtrip');

  console.assert(view[0] === 1);
};

test(self);

addEventListener('message', ({ data, ports: [channel] }) => {
  test(channel);
  postMessage('ok');
});
