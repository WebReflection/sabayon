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

const waitAsync = (view, mitm) => async () => {
  const buffer = await mitm.resolved(view);
  defineProperty(
    view,
    'buffer',
    asDescriptorValue(
      setPrototypeOf(buffer, SAB.prototype),
      false
    )
  );
  return 'ok';
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
  Int32Array: I32,
  BigInt64Array: I64,
  postMessage: pM
} = globalThis;

let ready = Promise.resolve();

if (!native) {
  const { parse } = JSON;
  const { promise, resolve } = withResolvers();

  const handler = new Handler('');
  const _ = mitm(handler);

  let SERVICE_WORKER = '';
  ready = promise;

  addEventListener(
    'message',
    event => {
      stop(event);
      [handler.id, SERVICE_WORKER] = event.data;
      resolve();
    },
    { once: true }
  );

  addEventListener(
    'message',
    event => {
      if (event.ports?.length) {
        for (const port of event.ports) {
          const postMessage = port.postMessage.bind(port);
          port.start();
          port.addEventListener('message', _.listener);
          defineProperty(
            port,
            'postMessage',
            asDescriptorValue(
              (data, ...rest) => _.send(postMessage, data, rest)
            )
          );
        }
      }
      _.listener(event);
    }
  );

  pM = (data, ...rest) => {
    if (handler.id.length) _.send(postMessage, data, rest);
    else promise.then(() => _.send(postMessage, data, rest));
  };

  A = create(A, {
    // TODO: currently only main notifies workers
    // notify: asDescriptorValue((...args) => handler.notify(...args)),
    wait: asDescriptorValue((view, index, ...rest) => {
      if (!handler.id) throw new Error('Worker is not ready');
      if (!SERVICE_WORKER) throw new Error('ServiceWorker not available');
      const id = _.id(view);
      const xhr = new XMLHttpRequest;
      xhr.open('POST', `${SERVICE_WORKER}?sabayon/lite`, false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(`["${handler.id}",${id}]`);
      console.log({ response: xhr.response });
      new Uint8Array(view.buffer).set(
        new Uint8Array(parse(xhr.responseText))
      );
      return 'ok';
    }),
    waitAsync: asDescriptorValue((view, index, value, timeout = Infinity) => ({
      async: true,
      value: promise.then(waitAsync(view, _))
    }))
  });

  // not really needed but in case brand check
  // for specialized classes needs to happen
  I32 = class extends I32 {};
  I64 = class extends I64 {};
}

export { A as Atomics, I64 as BigInt64Array, I32 as Int32Array, MC as MessageChannel, SAB as SharedArrayBuffer, native, pM as postMessage, ready };
