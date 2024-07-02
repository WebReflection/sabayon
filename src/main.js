// (c) Andrea Giammarchi - MIT

import {
  ACTION_INIT, ACTION_NOTIFY, ACTION_WAIT, ACTION_SW,

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

  const serviceWorkers = new Map;
  const sync = new Map;

  const addListener = (self, type, handler, ...rest) => {
    self.addEventListener(type, handler, ...rest);
  };

  const drop = uid => sync.delete(uid);

  const register = ({ serviceWorker: s }, sw, done) => {
    let w;
    addListener(s, 'message', event => {
      if (isChannel(event, CHANNEL)) {
        const [_, id, index] = event.data;
        const uid = [id, index].join(',');
        const [view, timer] = sync.get(uid);
        sync.delete(uid);
        clearTimeout(timer);
        w.postMessage([ CHANNEL, id, index, view ]);
      }
    });
    s.register(sw).then(function ready(r) {
      w = (r.installing || r.waiting || r.active);
      if (w.state === 'activated')
        done();
      else
        addListener(w, 'statechange', () => ready(r), { once: true });
    });
  };

  ignore = ignorePatch;

  Atomics.notify = (view, index) => {
    const [id, worker] = getData(view);
    const uid = [id, index].join(',');
    sync.set(uid, [view, setTimeout(drop, 1000, uid)]);
    worker.postMessage([CHANNEL, ACTION_NOTIFY, view, id, index]);
    return 0;
  };

  Atomics.waitAsync = (view, ...rest) => {
    const [_, value] = waitAsyncPoly(view, ...rest);
    return { value };
  };

  SharedArrayBuffer = class extends ArrayBuffer {}
  BigInt64Array = extend(BigInt64Array, SharedArrayBuffer);
  Int32Array = extend(Int32Array, SharedArrayBuffer);

  Worker = class extends Worker {
    constructor(url, options = {}) {
      let sw = options.serviceWorker || '';
      if (sw) {
        sw = new URL(sw, location.href).href;
        options = { ...options, serviceWorker: sw };
        if (!serviceWorkers.has(sw)) {
          const { promise, resolve } = withResolvers();
          register(navigator, sw, resolve);
          serviceWorkers.set(sw, promise);
        }
        serviceWorkers.get(sw).then(
          () => super.postMessage([CHANNEL, ACTION_SW])
        );
      }
      super(url, options);
      super.postMessage([CHANNEL, ACTION_INIT, options]);
      addListener(this, 'message', event => {
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
            case ACTION_SW: {
              const [_, timer] = sync.get(rest.join(','));
              clearTimeout(timer);
              break;
            }
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
  /** @type {globalThis.Atomics} */ Atomics,
  /** @type {globalThis.BigInt64Array} */ BigInt64Array,
  /** @type {globalThis.Int32Array} */ Int32Array,
  /** @type {globalThis.SharedArrayBuffer} */ SharedArrayBuffer,
  /** @type {globalThis.Worker} */ Worker,
  ignore,
};
