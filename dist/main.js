// (c) Andrea Giammarchi - MIT

const ACTION_INIT = 0;
const ACTION_NOTIFY = 1;
const ACTION_WAIT = 2;
const ACTION_SW = 3;

const { ArrayBuffer, Atomics: $Atomics, Promise: Promise$1 } = globalThis;
const { isArray } = Array;
const { create, getPrototypeOf, values } = Object;

const TypedArray = getPrototypeOf(Int32Array);
const Atomics = /** @type {globalThis.Atomics} */(create($Atomics));

const dispatch = ({ currentTarget, type, origin, lastEventId, source, ports }, data) =>
  currentTarget.dispatchEvent(new MessageEvent(type, { data, origin, lastEventId, source, ports }));

const withResolvers = () => Promise$1.withResolvers();

let id = 0;
const views = new Map;
const extend = (Class, SharedArrayBuffer) => class extends Class {
  constructor(value, ...rest) {
    super(value, ...rest);
    if (value instanceof SharedArrayBuffer)
      views.set(this, [id++, 0, withResolvers()]);
  }
};

const ignoreList = new WeakSet;

/**
 * @template {T}
 * @callback PassThrough
 * @param {T} value
 * @returns {T}
 */

/** @type {PassThrough} */
const ignoreDirect = value => value;

/** @type {PassThrough} */
const ignorePatch = value => {
  ignoreList.add(value);
  return value;
};

const isChannel = (event, channel) => {
  const { data } = event;
  const yes = isArray(data) && (
    data.at(0) === channel ||
    (data.at(1) === ACTION_INIT && !channel)
  );
  if (yes) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
  return yes;
};

const isObject = value => (
  value !== null &&
  typeof value === 'object' &&
  !ignoreList.has(value)
);

const transferred = new WeakMap;
const transferViews = (data, transfer, visited) => {
  if (views.has(data))
    transfer.set(data, views.get(data)[0]);
  else if (!(data instanceof TypedArray || data instanceof ArrayBuffer)) {
    for (const value of values(data)) {
      if (isObject(value) && !visited.has(value)) {
        visited.add(value);
        transferViews(value, transfer, visited);
      }
    }
  }
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/waitAsync#browser_compatibility
let intAsyncPatch = 0;
const waitAsyncPatch = (...args) => ({
  value: new Promise$1(async resolve => {
    // fallback to a local file to avoid CSP issues
    // this file must contain: onmessage=e=>postMessage(!Atomics.wait(...e.data))
    const url = '/__sabayon_wait_async.js';
    const data = 'data:application/javascript,onmessage%3De%3D%3EpostMessage(!Atomics.wait(...e.data))';
    // perform this check only once
    if (!intAsyncPatch) {
      const ok = fetch(url, { method: 'HEAD' }).then(r => r.ok, () => false);
      intAsyncPatch = (await ok) ? 1 : -1;
    }
    const worker = new Worker(intAsyncPatch < 0 ? data : url);
    worker.onmessage = () => {
      worker.terminate();
      resolve('ok');
    };
    worker.postMessage(args);
  })
});

const waitAsyncPoly = (view, index) => {
  const value = views.get(view), [id, _, { promise }] = value;
  value[1] = index;
  return [id, promise];
};

const actionNotify = (_view, _id, _index) => {
  for (const [view, [id, index, { resolve }]] of views) {
    if (_id === id && _index === index) {
      view.set(_view);
      views.delete(view);
      resolve('ok');
      break;
    }
  }
};

const actionWait = (event, transfer, data) => {
  for (const [view, id] of transfer)
    transferred.set(view, [id, event.currentTarget]);
  dispatch(event, data);
};

const postData = (CHANNEL, data) => {
  const transfer = new Map;
  if (isObject(data)) transferViews(data, transfer, new Set);
  return transfer.size ? [CHANNEL, ACTION_WAIT, transfer, data] : data;
};

const getData = view => transferred.get(view);

// (c) Andrea Giammarchi - MIT


let {
  BigInt64Array,
  Int32Array: Int32Array$1,
  SharedArrayBuffer,
  Worker: Worker$1,
} = globalThis;

let ignore = ignoreDirect;
let polyfill = false;

const asModule = options => ({ ...options, type: 'module' });

try {
  new SharedArrayBuffer(4);

  Worker$1 = class extends Worker$1 {
    constructor(url, options) {
      super(url, asModule(options));
    }
  };

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

  SharedArrayBuffer = class extends ArrayBuffer {};
  BigInt64Array = extend(BigInt64Array, SharedArrayBuffer);
  Int32Array$1 = extend(Int32Array$1, SharedArrayBuffer);

  let serviceWorker = null;
  Worker$1 = class extends Worker$1 {
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
  };
}

export { Atomics, BigInt64Array, Int32Array$1 as Int32Array, SharedArrayBuffer, Worker$1 as Worker, ignore, polyfill };
