import { SharedArrayBuffer, Int32Array, postMessage, wait } from '../../esm/worker.js';

const sb = new SharedArrayBuffer(4);
const view = new Int32Array(sb);

postMessage(view);
wait(view, 0);
console.log([...view]);
