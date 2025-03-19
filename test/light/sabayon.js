import { decoder } from 'https://esm.run/buffered-clone@0.7.1-next.8/decoder';
import { Atomics, Int32Array, SharedArrayBuffer, postMessage } from '../../dist/worker.js';

const native = true;

const decode = decoder({
  useUTF16: true,
  byteOffset: 4,
});

console.log('Sabayon Current', false);

console.time('total');
let sab, view;
for (let i = 0; i < 5; i++) {
  console.time('roundtrip');
  // ask for the length
  sab = new SharedArrayBuffer(8);
  view = new Int32Array(sab);
  postMessage([0, view]);
  await Atomics.waitAsync(view, 0).value;
  // ask for the result
  let length = view[1];
  length += 4 - (length % 4);
  sab = new SharedArrayBuffer(4 + length);
  view = new Int32Array(sab);
  postMessage([1, view]);
  await Atomics.waitAsync(view, 0).value;
  console.timeEnd('roundtrip');
}
console.timeEnd('total');

console.log(decode(new Uint8Array(view.buffer, 4)));
