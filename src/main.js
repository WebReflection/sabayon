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
let polyfill = false;

const asModule = options => ({ ...options, type: 'module' });

try {
  new SharedArrayBuffer(4);

  Worker = class extends Worker {
    constructor(url, options) {
      super(url, asModule(options));
    }
  }

  if (!Atomics.waitAsync)
    Atomics.waitAsync = waitAsyncPatch;
}
catch (_) {
  const CHANNEL = crypto.randomUUID();

  const sync = new Map;

  const addListener = (self, type, handler, ...rest) => {
    self.addEventListener(type, handler, ...rest);
  };

  const register = ({ serviceWorker: s }, sw, done) => {
    let w, c = true;
    addListener(s, 'message', event => {
      if (isChannel(event, CHANNEL)) {
        const [_, id, index] = event.data;
        const uid = [id, index].join(',');
        const done = view => {
          sync.delete(uid);
          w.postMessage([ CHANNEL, id, index, view ]);
        };
        const view = sync.get(uid);
        if (view) done(view);
        else {
          const { promise, resolve } = withResolvers();
          sync.set(uid, resolve);
          promise.then(done);
        }
      }
    });
    // use previous registration, if any, before registering it
    s.getRegistration(sw)
      .then(r => (r ?? s.register(sw)))
      .then(function ready(r) {
        c = c && !!s.controller;
        w = (r.installing || r.waiting || r.active);
        if (w.state === 'activated') {
          if (c) done();
          else location.reload();
        }
        else
          addListener(w, 'statechange', () => ready(r), { once: true });
      });
  };

  ignore = ignorePatch;
  polyfill = true;

  Atomics.notify = (view, index) => {
    const [id, worker] = getData(view);
    const uid = [id, index].join(',');
    const known = sync.get(uid);
    if (known) known(view);
    else sync.set(uid, view);
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

  let serviceWorker = null;
  Worker = class extends Worker {
    constructor(url, options) {
      let sw = options?.serviceWorker || '';
      if (sw) {
        sw = new URL(sw, location.href).href;
        options = { ...options, serviceWorker: sw };
        if (!serviceWorker) {
          const { promise, resolve } = withResolvers();
          register(navigator, sw, resolve);
          serviceWorker = promise;
        }
        serviceWorker.then(
          () => super.postMessage([CHANNEL, ACTION_SW])
        );
      }
      super(url, asModule(options));
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
  polyfill,
};
