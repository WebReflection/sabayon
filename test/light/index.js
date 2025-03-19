import { decoder } from 'https://esm.run/buffered-clone@0.7.1-next.8/decoder';
import { Atomics, Int32Array, SharedArrayBuffer, native as ignore, postMessage } from '../../dist/light/worker.js';

const native = false;

const decode = decoder({
  useUTF16: true,
  byteOffset: 4,
});

let view = new Int32Array(
  new SharedArrayBuffer(
    2 * Int32Array.BYTES_PER_ELEMENT,
    { maxByteLength: 0x1000000 }
  )
);

console.log('Sabayon Light', ignore);

console.time('total');
for (let i = 0; i < 5; i++) {
  console.time('roundtrip');
  postMessage(view);
  if (native)
    Atomics.wait(view, 0);
  else {
    await Atomics.waitAsync(view, 0).value;
    view = new Int32Array(view.buffer);
  }
  view[0] = 0;
  console.timeEnd('roundtrip');
}
console.timeEnd('total');

console.log(decode(new Uint8Array(view.buffer, 4)));
