// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/waitAsync#browser_compatibility
let src = '';
export default (...args) => new Promise(async resolve => {
  // fallback to a local file to avoid CSP issues
  // this file must contain: onmessage=e=>postMessage(!Atomics.wait(...e.data))
  const url = '/__sabayon_wait_async.js';
  const data = 'data:application/javascript,onmessage%3De%3D%3EpostMessage(!Atomics.wait(...e.data))';
  // perform this check only once
  if (!src) {
    const ok = fetch(url, { method: 'HEAD' }).then(r => r.ok, () => false);
    src = (await ok) ? url : data;
  }
  const worker = new Worker(src);
  worker.onmessage = () => {
    worker.terminate();
    resolve('ok');
  };
  worker.postMessage(args);
});
