import {
  ACTION_NOTIFY, ACTION_WAIT, ACTION_INIT,
  extend, isChannel, actionWait, transferred,
  ignoreDirect, ignorePatch,
  waitAsyncPatch,
} from './shared.js';

let {
  Int32Array,
  SharedArrayBuffer,
  postMessage,
} = globalThis;

let {
  notify,
  wait,
  waitAsync,
} = Atomics;

let ignore = ignoreDirect;

const ready = Promise.withResolvers();

try {
  new SharedArrayBuffer(4);
  if (!waitAsync) waitAsync = waitAsyncPatch;
  ready.resolve();
}
catch (_) {
  const $postMessage = postMessage;

  let CHANNEL = '';
  let SERVICE_WORKER = '';

  SharedArrayBuffer = class extends ArrayBuffer {}
  Int32Array = extend(Int32Array, SharedArrayBuffer);

  ignore = ignorePatch;

  notify = (view, index) => {
    if (!transferred.has(view)) throw new TypeError('Unable to notify this view');
    $postMessage([CHANNEL, ACTION_NOTIFY, view, transferred.get(view), index]);
    return 0;
  };

  addEventListener('message', event => {
    if (isChannel(event, CHANNEL)) {
      const [_, ACTION, ...rest] = event.data;
      switch (ACTION) {
        case ACTION_INIT: {
          CHANNEL = _;
          SERVICE_WORKER = rest.at(0)?.serviceWorker || '';
          if (!SERVICE_WORKER) ready.resolve();
          break;
        }
        case ACTION_WAIT: {
          actionWait(event, ...rest);
          break;
        }
        default:
          throw new TypeError(`Unknown action: ${ACTION}`);
      }
    }
  });
}

await ready.promise;

export {
  /** @type {globalThis.Int32Array} */ Int32Array,
  /** @type {globalThis.SharedArrayBuffer} */ SharedArrayBuffer,
  /** @type {globalThis.Atomics.notify} */ notify,
  /** @type {globalThis.Atomics.wait} */ wait,
  /** @type {globalThis.Atomics.waitAsync} */ waitAsync,
  /** @type {globalThis.postMessage} */ postMessage,
  ignore,
};
