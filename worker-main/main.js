import {
  ACTION_INIT, ACTION_NOTIFY, ACTION_WAIT,

  ArrayBuffer, Atomics,

  actionNotify, actionWait,
  getData, postData,
  ignoreDirect, ignorePatch,
  waitAsyncPatch, waitAsyncPoly,

  extend,
  isChannel,
} from './shared.js';

let {
  Int32Array,
  SharedArrayBuffer,
  Worker,
} = globalThis;

let ignore = ignoreDirect;

try {
  new SharedArrayBuffer(4);

  if (!Atomics.waitAsync)
    Atomics.waitAsync = waitAsyncPatch;
}
catch (_) {
  const CHANNEL = crypto.randomUUID();
  ignore = ignorePatch;

  Atomics.waitAsync = waitAsyncPoly;
  Atomics.notify = (view, index) => {
    const [id, worker] = getData(view);
    worker.postMessage([CHANNEL, ACTION_NOTIFY, view, id, index]);
    return 0;
  };

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
    postMessage(data, ...rest) {
      return super.postMessage(postData(CHANNEL, data), ...rest);
    }
  }
}

export {
  /** @type {globalThis.Int32Array} */ Int32Array,
  /** @type {globalThis.SharedArrayBuffer} */ SharedArrayBuffer,
  /** @type {globalThis.Worker} */ Worker,
  /** @type {globalThis.Atomics} */ Atomics,
  ignore,
};
