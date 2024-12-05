// (c) Andrea Giammarchi - MIT

import {
  ACTION_INIT, ACTION_NOTIFY, ACTION_WAIT, ACTION_SW,

  ArrayBuffer, Atomics,

  idPlus, sharedWorker,
  actionNotify, actionWait,
  getData, postData,
  ignoreDirect, ignorePatch,
  waitAsyncPatch, waitAsyncPoly,

  extend,
  isChannel, isObject, isTyped,
  views,
  withResolvers,
} from './shared.js';

let {
  BigInt64Array,
  Int32Array,
  SharedArrayBuffer,
  SharedWorker,
  Worker,
} = globalThis;

let CHANNEL = '';
let ignore = ignoreDirect;
let polyfill = false;

let { notify, waitAsync } = Atomics;
if (!waitAsync) waitAsync = waitAsyncPatch;
Atomics.notify = (...args) => notify(...args);
Atomics.waitAsync = (...args) => waitAsync(...args);

const sync = new Map;

const addListener = (self, type, handler, ...rest) => {
  self.addEventListener(type, handler, ...rest);
};

const asModule = options => ({ ...options, type: 'module' });

const message = event => {
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
};

const patchAtomics = () => {
  if (!CHANNEL) {
    CHANNEL = crypto.randomUUID();

    // partial patches for the SharedWorker only case
    // Workers with native SharedArrayBuffer should not
    // get affected much or penalized, performance wise
    const [$notify, $waitAsync] = [notify, waitAsync];

    notify = (view, index, ...rest) => {
      const data = getData(view);
      if (data) {
        const [id, worker] = data;
        const uid = [id, index].join(',');
        const known = sync.get(uid);
        if (known) known(view);
        else sync.set(uid, view);
        worker.postMessage([CHANNEL, ACTION_NOTIFY, view, id, index]);
        return 0;
      }
      else return $notify(view, index, ...rest);
    };
  
    waitAsync = (view, ...rest) => {
      if (views.has(view)) {
        const [_, value] = waitAsyncPoly(view, ...rest);
        return { value };
      }
      else return $waitAsync(view, ...rest);
    };
  }
};

if (SharedWorker) {
  // did you know? SharedArrayBuffer silently fails
  // when posted to a SharedWorker's port ... so
  // here a polyfill that works regardless w/ SAB
  const { defineProperties, entries } = Object;

  const fix = (data) => {
    for (const [key, value] of entries(data)) {
      if (isObject(value)) {
        const overridden = override(value);
        if (overridden)
          data[key] = overridden;
        else if (!isTyped(value))
          fix(value);
      }
    }
  };

  const override = value => {
    if (
      !views.has(value) &&
      (value instanceof Int32Array || value instanceof BigInt64Array) &&
      !(value.buffer instanceof ArrayBuffer)
    ) {
      const clone = value.slice(0);
      const details = [idPlus(), 0, withResolvers()];
      // set SAB before clone to fix it once clone is resolved
      views.set(value, details);
      views.set(clone, details);
      sharedWorker.set(value, clone);
      return clone;
    }
  };

  const postFixed = (CHANNEL, data) => {
    if (isObject(data)) {
      const overridden = override(data);
      if (overridden)
        data = overridden;
      else if (!isTyped(data))
        fix(data);
    }
    return postData(CHANNEL, data);
  };

  SharedWorker = class extends SharedWorker {
    constructor(url, options) {
      patchAtomics();
      const { port } = super(url, { name: 'sabayon', ...asModule(options) });
      const postMessage = port.postMessage.bind(port);
      addListener(port, 'message', message);
      defineProperties(port, {
        postMessage: {
          configurable: true,
          value: (data, ...rest) => postMessage(postFixed(CHANNEL, data), ...rest)
        }
      }).start();
      postMessage([CHANNEL, ACTION_INIT, options]);
    }
  };
}

try {
  new SharedArrayBuffer(4);

  Worker = class extends Worker {
    constructor(url, options) {
      super(url, asModule(options));
    }
  };
}
catch (_) {
  ignore = ignorePatch;
  polyfill = true;

  patchAtomics();

  SharedArrayBuffer = class extends ArrayBuffer {}
  BigInt64Array = extend(BigInt64Array, SharedArrayBuffer);
  Int32Array = extend(Int32Array, SharedArrayBuffer);

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
        serviceWorker.then(() => super.postMessage([CHANNEL, ACTION_SW]));
      }
      super(url, asModule(options));
      super.postMessage([CHANNEL, ACTION_INIT, options]);
      addListener(this, 'message', message);
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
  /** @type {globalThis.SharedWorker} */ SharedWorker,
  /** @type {globalThis.Worker} */ Worker,
  ignore,
  polyfill,
};
