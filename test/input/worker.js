import {
  Atomics,
  Int32Array,
  SharedArrayBuffer,
  postMessage,
} from '../../dist/worker.js';

const sb = new SharedArrayBuffer(1024);
const view = new Int32Array(sb);

postMessage(view);

console.log('asking for something ...');

Atomics.wait(view, 0);

const chars = [];
for (let i = 0; i < view.length; i++) {
  if (view[i]) chars[i] = view[i];
  else break;
}

console.log('Input:', String.fromCharCode(...view));
