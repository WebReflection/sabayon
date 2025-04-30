// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/waitAsync#browser_compatibility
let src = '';

/**
 * @param {string} url fallback to a local file to avoid CSP issues.
 *                     this file must contain: onmessage=e=>postMessage(!Atomics.wait(...e.data))
 * @param {...any} args
 * @returns {Promise<string>}
 */
export default (url, ...args) => new Promise(async resolve => {
  if (!src) {
    const ok = url ? fetch(url, { method: 'HEAD' }).then(r => r.ok, () => false) : false;
    src = (await ok) ? url : 'data:application/javascript,onmessage%3De%3D%3EpostMessage(!Atomics.wait(...e.data))';
  }
  const worker = new Worker(src);
  worker.onmessage = () => {
    worker.terminate();
    resolve('ok');
  };
  worker.postMessage(args);
});
