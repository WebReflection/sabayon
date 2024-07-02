import {
  Atomics,
  Int32Array,
  SharedArrayBuffer,
  postMessage,
} from '../../dist/worker.js';

const ask = question => {
  const sb = new SharedArrayBuffer(1024);
  const view = new Int32Array(sb);
  postMessage({ message: question, view });
  Atomics.wait(view, 0);
  const chars = [];
  for (let i = 0; i < view.length; i++) {
    if (view[i]) chars[i] = view[i];
    else break;
  }
  return String.fromCharCode(...chars);
};

const name = ask('what is your name?');
const surname = ask('what is your surname?');

postMessage({ message: `Hello ${name} ${surname} 👋` });
