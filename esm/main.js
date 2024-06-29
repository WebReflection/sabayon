import {
  ACTION_INIT,
  ACTION_READY,
  ACTION_NOTIFY,
  ACTION_WAIT,
  ACTION_SW,
  ArrayBuffer,
  isChannel, isObject,
  views, extend,
  ignoreDirect, ignorePatch,
  transferred, transferViews,
  dispatch, postData,
  actionNotify, actionWait,
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
  // if this works, there's nothing to do here
  new SharedArrayBuffer(4);

  // except for Firefox ...
  if (!waitAsync) waitAsync = waitAsyncPatch;
}
catch (_) {
  const CHANNEL = crypto.randomUUID();

  const addListener = (self, type, handler, ...rest) => {
    self.addEventListener(type, handler, ...rest);
  };

  const register = ({ serviceWorker: s }, sw, done) => {
    let w;
    addListener(s, 'message', event => {
      if (isChannel(event, CHANNEL)) {
        w.postMessage([ CHANNEL ]);
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

  const services = new Map;
  const serviceWorkers = new Map;
  const sync = { then: $ => $() };

  ignore = ignorePatch;
  waitAsync = waitAsyncPoly;

  SharedArrayBuffer = class extends ArrayBuffer {}
  Int32Array = extend(Int32Array, SharedArrayBuffer);

  Worker = class extends Worker {
    constructor(url, options = {}) {
      super(url, options);
      let sw = options.serviceWorker || '';
      if (sw) {
        sw = new URL(sw, location.href).href;
        if (!serviceWorkers.has(sw)) {
          const { promise, resolve } = Promise.withResolvers();
          register(navigator, sw, resolve);
          serviceWorkers.set(sw, promise);
        }
        services.set(
          this,
          serviceWorkers.get(sw).then(
            () => super.postMessage([CHANNEL, ACTION_READY])
          )
        );
      }
      else {
        services.set(this, sync);
      }
      addListener(this, 'message', event => {
        if (isChannel(event, CHANNEL)) {
          const [_, action, ...rest] = event.data;
          switch (action) {
            case ACTION_NOTIFY: {
              actionNotify(...rest);
              break;
            }
            case ACTION_WAIT: {
              actionWait(event, ...rest);
              break;
            }
            default:
              throw new TypeError(`Unknown action: ${action}`);
          }
        }
      });
      super.postMessage([CHANNEL, sw]);
    }
    postMessage(data, ...rest) {
      services.get(this).then(() => super.postMessage(
        postData(CHANNEL, data),
        ...rest
      ));
    }
  }

  addListener(globalThis, 'message', event => {
    if (isChannel(event, CHANNEL)) {
      console.log(event.data);
    }
  });
}

export {
  /** @type {globalThis.Int32Array} */ Int32Array,
  /** @type {globalThis.SharedArrayBuffer} */ SharedArrayBuffer,
  /** @type {globalThis.Worker} */ Worker,
  /** @type {globalThis.Atomics.notify} */ notify,
  /** @type {globalThis.Atomics.waitAsync} */ waitAsync,
  ignore,
};
