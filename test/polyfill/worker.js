console.time('worker bootstrap');
if (!crossOriginIsolated) {
  const events = [];
  const push = events.push.bind(events);
  addEventListener('message', push);
  const { default: sabayon } = await import('../../dist/polyfill.js');
  // main sends the first message to the worker to resolve the promise
  self.dispatchEvent(events.shift());
  await sabayon();
  removeEventListener('message', push);
  // give the rest of the code an event tick to bootstrap
  // so that possible added listeners won't be lost
  setTimeout(() => {
    for (const event of events)
      self.dispatchEvent(event);
  });
}
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

addEventListener('message', ({ data, ports: [channel] }) => {
  test(channel);
  postMessage('ok');
});

test(self);
test(self);
test(self);
