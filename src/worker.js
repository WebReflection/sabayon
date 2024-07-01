// (c) Andrea Giammarchi - MIT

import {
  ACTION_INIT, ACTION_NOTIFY, ACTION_WAIT, ACTION_SW,

  ArrayBuffer, Atomics,

  actionNotify, actionWait,
  getData, postData,
  ignoreDirect, ignorePatch,
  waitAsyncPatch, waitAsyncPoly,

  dispatch,
  extend,
  isChannel,
  views,
  withResolvers,
} from './shared.js';

let {
  Int32Array,
  SharedArrayBuffer,
  addEventListener,
  postMessage,
} = globalThis;

let ignore = ignoreDirect;
let bootstrapping = true;

const ready = withResolvers();

try {
  new SharedArrayBuffer(4);

  if (!Atomics.waitAsync)
    Atomics.waitAsync = waitAsyncPatch;

  ready.resolve();
}
catch (_) {
  const { stringify, parse } = JSON;
  const $postMessage = postMessage;
  const $addEventListener = addEventListener;

  const trap = ({ currentTarget, type, origin, lastEventId, source, ports }) =>
    ({ currentTarget, type, origin, lastEventId, source, ports });

  const messages = [];

  let CHANNEL = '';
  let SERVICE_WORKER = '';

  SharedArrayBuffer = class extends ArrayBuffer {}
  Int32Array = extend(Int32Array, SharedArrayBuffer);

  ignore = ignorePatch;

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
    $postMessage([CHANNEL, ACTION_SW, id, index]);
    const xhr = new XMLHttpRequest;
    xhr.open('POST', `${SERVICE_WORKER}?sabayon`, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(stringify([CHANNEL, id, index]));
    const buffer = parse(xhr.responseText);
    views.delete(view);
    for (let i = 0; i < buffer.length; i++) view[i] = buffer[i];
    return 'ok';
  };

  $addEventListener('message', event => {
    if (isChannel(event, CHANNEL)) {
      const [_, ACTION, ...rest] = event.data;
      switch (ACTION) {
        case ACTION_INIT: {
          CHANNEL = _;
          SERVICE_WORKER = rest.at(0)?.serviceWorker || '';
          if (!SERVICE_WORKER) ready.resolve();
          break;
        }
        case ACTION_NOTIFY: {
          actionNotify(...rest);
          break;
        }
        case ACTION_WAIT: {
          const [transfer, data] = rest;
          actionWait(event, transfer, data);
          if (bootstrapping)
            messages.push([trap(event), data]);
          break;
        }
        case ACTION_SW: {
          ready.resolve();
          break;
        }
      }
    }
  });

  addEventListener = (type, ...args) => {
    $addEventListener(type, ...args);
    if (type === 'message') {
      for (const args of messages.splice(0))
        dispatch(...args);
    }
  };

  postMessage = (data, ...rest) => $postMessage(postData(CHANNEL, data), ...rest);
}

await ready.promise;

bootstrapping = false;

export {
  /** @type {globalThis.Atomics} */ Atomics,
  /** @type {globalThis.Int32Array} */ Int32Array,
  /** @type {globalThis.SharedArrayBuffer} */ SharedArrayBuffer,
  /** @type {globalThis.addEventListener} */ addEventListener,
  /** @type {globalThis.postMessage} */ postMessage,
  ignore,
};
