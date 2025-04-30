console.time('worker bootstrap');
import sabayon from '../../dist/polyfill.js';
await sabayon();
console.timeEnd('worker bootstrap');

const sb = new SharedArrayBuffer(4);
const view = new Int32Array(sb);

const test = async self => {
  view[0] = 0;

  console.time('roundtrip');
  self.postMessage({ some: 'value', view });

  console.time('wait');
  await Atomics.waitAsync(view, 0).value;
  console.timeEnd('wait');
  console.timeEnd('roundtrip');

  console.assert(view[0] === 1);
};

addEventListener('message', async ({ data, ports: [channel] }) => {
  await q.then(() => test(channel));
  postMessage('ok');
});

let q = test(self);
