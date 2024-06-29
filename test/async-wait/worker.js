import {
  Int32Array,
  SharedArrayBuffer,
  waitAsync,
  postMessage,
} from '../../worker-main/worker.js';


const sb = new SharedArrayBuffer(4);
const view = new Int32Array(sb);

postMessage({ some: 'value', view });

waitAsync(view, 0).value.then(result => {
  console.assert(view[0] === 1);
  console.log('Worker', result);
  postMessage('ok');
});
