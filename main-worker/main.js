import {
  ACTION_NOTIFY, ACTION_INIT,
  extend, isChannel, postData, actionNotify,
  ignoreDirect, ignorePatch,
  waitAsyncPatch, waitAsyncPoly,
} from './shared.js';

let {
  Int32Array,
  SharedArrayBuffer,
  Worker,
} = globalThis;

let {
  notify,
  waitAsync,
} = Atomics;

let ignore = ignoreDirect;

try {
  new SharedArrayBuffer(4);
  if (!waitAsync) waitAsync = waitAsyncPatch;
}
catch (_) {
  const CHANNEL = crypto.randomUUID();

  ignore = ignorePatch;
  waitAsync = waitAsyncPoly;

  SharedArrayBuffer = class extends ArrayBuffer {}
  Int32Array = extend(Int32Array, SharedArrayBuffer);

  Worker = class extends Worker {
    constructor(url, ...rest) {
      super(url, ...rest);
      super.postMessage([CHANNEL, ACTION_INIT, ...rest]);
      this.addEventListener('message', event => {
        if (isChannel(event, CHANNEL)) {
          const [_, ACTION, ...rest] = event.data;
          switch (ACTION) {
            case ACTION_NOTIFY: {
              actionNotify(...rest);
              break;
            }
            default:
              throw new TypeError(`Unknown action: ${ACTION}`);
          }
        }
      });
    }
    postMessage(data, ...rest) {
      super.postMessage(postData(CHANNEL, data), ...rest);
    }
  }
}

export {
  /** @type {globalThis.Int32Array} */ Int32Array,
  /** @type {globalThis.SharedArrayBuffer} */ SharedArrayBuffer,
  /** @type {globalThis.Worker} */ Worker,
  /** @type {globalThis.Atomics.notify} */ notify,
  /** @type {globalThis.Atomics.waitAsync} */ waitAsync,
  ignore,
};
