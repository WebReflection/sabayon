// (c) Andrea Giammarchi - MIT

import { SharedArrayBuffer as SAB, native } from '@webreflection/utils/shared-array-buffer';

import { parse, reviver } from '@ungap/raw-json';

import {
  ACTION_INIT, ACTION_NOTIFY, ACTION_WAIT, ACTION_SW,

  Atomics,

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
  BigInt64Array,
  Int32Array,
  SharedArrayBuffer,
  addEventListener,
  postMessage,
} = globalThis;

let bootstrapping = true;
let ignore = ignoreDirect;
let polyfill = !native;

const ready = withResolvers();

if (native) {
  if (!Atomics.waitAsync)
    Atomics.waitAsync = waitAsyncPatch;

  ready.resolve();
}
else {
  const $postMessage = postMessage;
  const $addEventListener = addEventListener;

  const messages = [];

  let CHANNEL = '';
  let SERVICE_WORKER = '';

  SharedArrayBuffer = SAB;
  BigInt64Array = extend(BigInt64Array, SharedArrayBuffer);
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

export {
  /** @type {globalThis.Atomics} */ Atomics,
  /** @type {globalThis.BigInt64Array} */ BigInt64Array,
  /** @type {globalThis.Int32Array} */ Int32Array,
  /** @type {globalThis.SharedArrayBuffer} */ SharedArrayBuffer,
  /** @type {globalThis.addEventListener} */ addEventListener,
  /** @type {globalThis.postMessage} */ postMessage,
  ignore,
  polyfill,
};
