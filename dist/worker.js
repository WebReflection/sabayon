let { parse, rawJSON} = JSON;

if (!rawJSON) {
  // isRawJSON
  const { freeze, setPrototypeOf } = Object;
  class RawJSON {
    static isRawJSON(o) {
      return typeof o === 'object' && !!o && #rawJSON in o;
    }
    #rawJSON = true;
    constructor(rawJSON) {
      this.rawJSON = rawJSON;
      freeze(setPrototypeOf(this, null));
    }
  }

  // rawJSON
  rawJSON = value => {
    const type = typeof value;
    switch (type) {
      case 'object':
        if (value) break;
      case 'bigint':
      case 'boolean':
      case 'number':
        value = String(value);
      case 'string':
        parse(value);
        return new RawJSON(value);
    }
    throw new TypeError('Unexpected ' + type);
  };

  // parse
  const p = parse;
  parse = (text, reviver) => {
    if (typeof reviver === 'function') {
      const $ = reviver;
      const a = [];
      text = String(text).replace(
        // parse all primitives in one go: string | number | boolean | null
        /(?:"(?:(?=(\\?))\1.)*?"\s*:?|[0-9eE+.-]+|true|false|null)/g,
        $ => $.at(-1) !== ':' ? ($[0] === '"' ? (a.push($) - 1) : `"${$}"`) : $
      );
      reviver = function (key, source) {
        switch (typeof source) {
          // abracadabra
          case 'number': source = a[source];
          case 'string': return $.call(this, key, p(source), { source });
        }
        return $.call(this, key, source, {});
      };
    }
    return p(text, reviver);
  };
}

const reviver = (_, value, context) => (
  typeof value === 'number' && String(value) !== context?.source ?
    BigInt(context.source) : value
);

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
  addEventListener,
  postMessage,
} = globalThis;

let bootstrapping = true;
let ignore = ignoreDirect;
let polyfill = false;

const ready = withResolvers();

try {
  new SharedArrayBuffer(4);

  if (!Atomics.waitAsync)
    Atomics.waitAsync = waitAsyncPatch;

  ready.resolve();
}
catch (_) {
  const $postMessage = postMessage;
  const $addEventListener = addEventListener;

  const messages = [];

  let CHANNEL = '';
  let SERVICE_WORKER = '';

  SharedArrayBuffer = class extends ArrayBuffer {};
  BigInt64Array = extend(BigInt64Array, SharedArrayBuffer);
  Int32Array$1 = extend(Int32Array$1, SharedArrayBuffer);

  ignore = ignorePatch;
  polyfill = true;

  Atomics.notify = (view, index) => {
    const [id] = getData(view);
    $postMessage([CHANNEL, ACTION_NOTIFY, view, id, index]);
    return 0;
  };

  Atomics.waitAsync = (...args) => {
    const [_, value] = waitAsyncPoly(...args);
    return { value };
  };

  Atomics.wait = (view, index, ...rest) => {
    const [id] = waitAsyncPoly(view, index, ...rest);
    const xhr = new XMLHttpRequest;
    xhr.open('POST', `${SERVICE_WORKER}?sabayon`, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(`["${CHANNEL}",${id},${index}]`);
    views.delete(view);
    const response = view instanceof BigInt64Array ?
      parse(xhr.responseText, reviver) :
      parse(xhr.responseText)
    ;
    view.set(response);
    return 'ok';
  };

  $addEventListener('message', event => {
    if (isChannel(event, CHANNEL)) {
      const [_, ACTION, ...rest] = event.data;
      switch (ACTION) {
        case ACTION_INIT: {
          CHANNEL = _;
          SERVICE_WORKER = rest.at(0)?.serviceWorker || '';
          if (!SERVICE_WORKER) {
            Atomics.wait = null;
            ready.resolve();
          }
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
        case ACTION_SW: {
          ready.resolve();
          break;
        }
      }
    }
    else if (bootstrapping) {
      const { currentTarget, type, origin, lastEventId, source, ports } = event;
      messages.push([{ currentTarget, type, origin, lastEventId, source, ports }, event.data]);
    }
  });

  addEventListener = (type, ...args) => {
    $addEventListener(type, ...args);
    if (messages.length) {
      for (const args of messages.splice(0))
        dispatch(...args);
    }
  };

  postMessage = (data, ...rest) => $postMessage(postData(CHANNEL, data), ...rest);
}

await ready.promise;

bootstrapping = false;

export { Atomics, BigInt64Array, Int32Array$1 as Int32Array, SharedArrayBuffer, addEventListener, ignore, polyfill, postMessage };
