import {
  ArrayBuffer,
  isArray, isObject,
  views, extend,
  ignoreDirect, ignorePatch,
  transferred, transferViews,
  dispatch,
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
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/waitAsync#browser_compatibility
  if (!waitAsync) {
    waitAsync = (buffer, index) => ({
      value: new Promise(resolve => {
        // encodeURIComponent('onmessage=e=>postMessage(!Atomics.wait(...e.data))')
        let w = new Worker('data:application/javascript,onmessage%3De%3D%3EpostMessage(!Atomics.wait(...e.data))');
        w.onmessage = () => resolve('ok');
        w.postMessage([buffer, index]);
      })
    });
  }
}
catch (_) {
  const CHANNEL = crypto.randomUUID();

  const { prototype: { postMessage }} = Worker;

  const addListener = (self, type, handler, ...rest) => {
    self.addEventListener(type, handler, ...rest);
  };

  const isChannel = event => {
    const { data } = event;
    const yes = isArray(data) && data.at(0) === CHANNEL;
    if (yes) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
    return yes;
  };

  const register = ({ serviceWorker: s }, sw, done) => {
    let w;
    addListener(s, 'message', event => {
      if (isChannel(event)) {
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

  waitAsync = (view, index) => {
    const value = views.get(view);
    if (!isArray(value)) throw new TypeError('Unable to waitAsync this view');
    value[1] = index;
    return { value: value[2].promise };
  };

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
        services.set(this, serviceWorkers.get(sw).then(() => {
          postMessage.call(this, [CHANNEL, 'ready']);
        }));
      }
      else {
        services.set(this, sync);
      }
      addListener(this, 'message', event => {
        if (isChannel(event)) {
          const [_, action, ...rest] = event.data;
          switch (action) {
            case 'notify': {
              const [_view, _id, _index] = rest;
              for (const [view, [id, index, { resolve }]] of views) {
                if (_id === id && _index === index) {
                  for (let i = 0; i < _view.length; i++) view[i] = _view[i];
                  views.delete(view);
                  resolve('ok');
                  break;
                }
              }
              break;
            }
            case 'wait': {
              const [transfer, object] = rest;
              for (const [view, id] of transfer)
                transferred.set(view, id);
              dispatch(event, object);
              break;
            }
            default:
              throw new TypeError(action);
          }
        }
      });
      postMessage.call(this, [CHANNEL, sw]);
    }
    postMessage(data, ...rest) {
      services.get(this).then(() => {
        const transfer = new Map;
        if (isObject(data)) transferViews(data, transfer);
        postMessage.call(
          this,
          transfer.size ? [CHANNEL, 'wait', transfer, data] : data,
          ...rest
        );
      });
    }
  }

  addListener(globalThis, 'message', event => {
    if (isChannel(event)) {
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
