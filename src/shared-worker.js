// (c) Andrea Giammarchi - MIT

import {
  ACTION_INIT, ACTION_NOTIFY, ACTION_WAIT,

  ArrayBuffer, Atomics,

  actionNotify, actionWait,
  getData, postData,
  ignoreDirect, ignorePatch,
  waitAsyncPatch, waitAsyncPoly,

  extend,
  isChannel,
  withResolvers,
} from './shared.js';

let {
  BigInt64Array,
  Int32Array,
  SharedArrayBuffer,
} = globalThis;

let ignore = ignoreDirect;
let polyfill = false;

try {
  new SharedArrayBuffer(4);

  if (!Atomics.waitAsync)
    Atomics.waitAsync = waitAsyncPatch;
}
catch (_) {

  const { defineProperties } = Object;
  const portDetails = new WeakMap;

  addEventListener('connect', ({ ports }) => {
    for (const port of ports) {
      let CHANNEL = '';
      const { promise, resolve } = withResolvers();
      const postMessage = port.postMessage.bind(port);
      port.addEventListener('message', event => {
        if (isChannel(event, CHANNEL)) {
          const [_, ACTION, ...rest] = event.data;
          switch (ACTION) {
            case ACTION_INIT: {
              CHANNEL = _;
              portDetails.set(port, [CHANNEL, postMessage]);
              resolve();
              break;
            }
            case ACTION_NOTIFY: {
              actionNotify(...rest);
              break;
            }
            case ACTION_WAIT: {
              actionWait(event, ...rest);
              break;
            }
          }
        }
      });
      defineProperties(port, {
        postMessage: {
          configurable: true,
          value: (data, ...rest) => {
            promise.then(() => postMessage(postData(CHANNEL, data), ...rest));
          },
        }
      }).start();
      postMessage(ACTION_INIT);
    }
  });

  SharedArrayBuffer = class extends ArrayBuffer {}
  BigInt64Array = extend(BigInt64Array, SharedArrayBuffer);
  Int32Array = extend(Int32Array, SharedArrayBuffer);

  ignore = ignorePatch;
  polyfill = true;

  Atomics.notify = (view, index) => {
    const [id, port] = getData(view);
    const [CHANNEL, postMessage] = portDetails.get(port);
    postMessage([CHANNEL, ACTION_NOTIFY, view, id, index]);
    return 0;
  };

  Atomics.waitAsync = (...args) => {
    const [_, value] = waitAsyncPoly(...args);
    return { value };
  };
}

export {
  /** @type {globalThis.Atomics} */ Atomics,
  /** @type {globalThis.BigInt64Array} */ BigInt64Array,
  /** @type {globalThis.Int32Array} */ Int32Array,
  /** @type {globalThis.SharedArrayBuffer} */ SharedArrayBuffer,
  ignore,
  polyfill,
};
