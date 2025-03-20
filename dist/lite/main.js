//@ts-check

let { SharedArrayBuffer: SAB } = globalThis;

let native = true;

try {
  //@ts-ignore due valid options not recognized
  new SharedArrayBuffer(4, { maxByteLength: 8 });
}
catch (_) {
  native = false;
  SAB = /** @type {SharedArrayBufferConstructor} */(
    /** @type {unknown} */(
      class SharedArrayBuffer extends ArrayBuffer {
        /** @readonly @type {boolean} */
        get growable() {
          //@ts-ignore due valid property not recognized
          return super.resizable;
        }

        /** @param {number} newLength */
        grow(newLength) {
          //@ts-ignore due valid method not recognized
          super.resize(newLength);
        }
      }
    )
  );
}

//@ts-check


const { isArray } = Array;
const { isView } = ArrayBuffer;

const {
  create,
  defineProperty,
  setPrototypeOf
} = Object;

const asDescriptorValue = (value, writable = true) => ({
  configurable: true,
  writable,
  value
});

/**
 * @param {any} data
 * @param {string} id
 * @returns
 */
const isChannel = (data, id) => (
  isArray(data) &&
  data.length === 2 &&
  data[0] === id
);

/**
 * @param {MessageEvent} event
 */
const stop = event => {
  event.stopImmediatePropagation();
  event.preventDefault();
};

const withResolvers = () => {
  //@ts-ignore
  return Promise.withResolvers();
};

const toBeNotified = new Map;

const find$1 = (o, k) => o[k];

class Handler {
  constructor(id) {
    this.id = id;
  }
  handleEvent(event) {
    const { currentTarget, data } = event;
    if (isChannel(data, this.id)) {
      const { id, path, value } = data[1];
      const buffer = setPrototypeOf(
        path.reduce(find$1, value),
        SAB.prototype
      );
      toBeNotified.set(buffer, [currentTarget, id]);
      defineProperty(event, 'data', { value });
    }
  }
  notify({ buffer }, index, count = Infinity) {
    const [port, id] = toBeNotified.get(buffer);
    toBeNotified.delete(buffer);
    port.postMessage([this.id, { id, value: buffer }], [buffer]);
  }
}

const handler = new Handler(crypto.randomUUID());

const find = (data, path, set) => {
  if (data != null && typeof data === 'object' && !set.has(data)) {
    if (data instanceof SAB)
      return { buffer: data, path };
    if (isView(data)) {
      set.add(data);
      return find(data.buffer, path.concat('buffer'), set);
    }
    if (isArray(data)) {
      set.add(data);
      for (let i = 0; i < data.length; i++) {
        const found = find(data[i], path.concat(i), set);
        if (found) return found;
      }
    }
    else if (!(data instanceof Error)) {
      set.add(data);
      for (const key in data) {
        const found = find(data[key], path.concat(key), set);
        if (found) return found;
      }
    }
  }
};

const fixRest = (buffer, rest) => {
  let options = rest.at(-1);
  switch (typeof options) {
    case 'undefined':
    case 'string': {
      rest.push([buffer]);
      break;
    }
    default: {
      if (isArray(options))
        options.push(buffer);
      else if (!options.transfer)
        options.transfer = [buffer];
      else
        options.transfer.push(buffer);
    }
  }
};

var mitm = handler => {
  const resolve = ({ id, value }) => {
    console.log('RESOLVED', id);
    const { buffer, resolve } = ids.get(id);
    ids.delete(id);
    promises.delete(buffer);
    resolve(value);
  };
  const promises = new Map;
  const ids = new Map;
  let id = 0;
  return {
    resolve,
    id: ({ buffer }) => promises.get(buffer).id,
    buffer: id => ids.get(id).buffer,
    resolved: ({ buffer }) => promises.get(buffer).promise,
    listener(event) {
      if (isChannel(event.data, handler.id)) {
        stop(event);
        resolve(event.data[1]);
      }
    },
    send(postMessage, data, rest) {
      console.log('SENDING', data);
      const found = find(data, [], new Set);
      if (found) {
        const { resolve, promise } = withResolvers();
        const { buffer, path } = found;
        fixRest(buffer, rest);
        data = [handler.id, { id, path, value: data }];
        promises.set(buffer, { id, promise });
        ids.set(id++, { buffer, resolve });
      }
      postMessage(data, ...rest);
    }
  };
};

let { MessageChannel: MC } = globalThis;

if (!native) {
  MC = class MessageChannel extends MC {
    constructor() {
      // TODO: should it start and also post the handler.id?
      //       right now this works only via a Worker
      //       as the SAB creating target that needs to be resolved
      //       on the same main ... this could be a better story though
      //       where every channel gets its own unique ID ... so ...
      //       ⚠️ only one channel per worker makes sense right now!
      super().port1.addEventListener('message', handler);
    }
  };
}

//@ts-check


let {
  Atomics: A,
  Worker: W,
} = globalThis;

if (!native) {
  const _ = mitm(handler);

  let hasServiceWorker = false;

  const register = ({ serviceWorker: s }, sw) => {
    let w, c = true;
    s.addEventListener('message', event => {
      if (isChannel(event.data, handler.id)) {
        const [CHANNEL, id] = event.data;
        console.log('SERVICE WORKER', id);
        const buffer = _.buffer(id);
        _.resolved({ buffer }).then(
          value => {
            w.postMessage(
              [[CHANNEL, id].join(','), new Uint8Array(value)],
              [value]
            );
          }
        );
      }
    });
    s.getRegistration(sw)
      .then(r => (r ?? s.register(sw)))
      .then(function ready(r) {
        c = c && !!s.controller;
        w = (r.installing || r.waiting || r.active);
        if (w.state === 'activated') {
          if (!c) location.reload();
        }
        else
          w.addEventListener('statechange', () => ready(r), { once: true });
      });
  };

  A = create(A, {
    notify: asDescriptorValue((...args) => handler.notify(...args)),
    // TODO: currently only main notifies workers
    // waitAsync: asDescriptorValue((view, index, value, timeout = Infinity) => ({
    //   async: true,
    //   value: waitAsync(view, _)
    // }))
  });

  W = class Worker extends W {
    constructor(scriptURL, ...rest) {
      let sw = rest.at(0)?.serviceWorker || '';
      if (sw) {
        sw = new URL(sw, location.href).href;
        if (!hasServiceWorker) {
          hasServiceWorker = true;
          register(navigator, sw);
        }
      }
      //@ts-ignore
      super(scriptURL, ...rest);
      super.addEventListener('message', handler);
      super.postMessage([handler.id, sw]);
    }
  };
}

export { A as Atomics, MC as MessageChannel, SAB as SharedArrayBuffer, W as Worker, native };
