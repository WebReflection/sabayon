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

const firstContact = Promise.withResolvers();

let {
  Int32Array,
  SharedArrayBuffer,
  postMessage,
} = globalThis;

let {
  notify,
  wait,
  waitAsync,
} = Atomics;

let ignore = ignoreDirect;

try {
  // if this works, there's nothing to do here
  new SharedArrayBuffer(4);

  // except for Firefox ...
  if (!waitAsync) waitAsync = waitAsyncPatch;

  firstContact.resolve();
}
catch (_) {
  const { parse, stringify } = JSON;
  const _postMessage = postMessage;

  let init = true;
  let CHANNEL = '';
  let SERVICE_WORKER = '';

  ignore = ignorePatch;
  waitAsync = waitAsyncPoly;

  notify = (view, index) => {
    if (!transferred.has(view))
      throw new TypeError('Unable to notify this view');
    _postMessage([CHANNEL, ACTION_NOTIFY, view, transferred.get(view), index]);
    return 0;
  };

  postMessage = (data, ...rest) => _postMessage(
    postData(CHANNEL, data),
    ...rest
  );

  wait = (view, index) => {
    console.log({ CHANNEL, SERVICE_WORKER });
    const xhr = new XMLHttpRequest;
    xhr.open('POST', `${SERVICE_WORKER}?sabayon`, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(stringify([CHANNEL, ACTION_SW, views.get(view)[0], index]));
    console.log({ responseText: xhr.responseText });
    const buffer = parse(xhr.responseText);
    for (let i = 0; i < buffer.length; i++) view[i] = buffer[i];
    return 'ok';
  };

  SharedArrayBuffer = class extends ArrayBuffer {}
  Int32Array = extend(Int32Array, SharedArrayBuffer);

  addEventListener('message', event => {
    const { data } = event;
    if (init) {
      init = !init;
      [CHANNEL, SERVICE_WORKER] = data;
      isChannel(event, CHANNEL);
      if (!SERVICE_WORKER) firstContact.resolve();
    }
    else if (isChannel(event, CHANNEL)) {
      const [_, action, ...rest] = data;
      switch (action) {
        case ACTION_NOTIFY: {
          actionNotify(...rest);
          break;
        }
        case ACTION_WAIT: {
          actionWait(event, ...rest);
          break;
        }
        case ACTION_READY: {
          firstContact.resolve();
          break;
        }
        default:
          throw new TypeError(action);
      }
    }
  });
}

await firstContact.promise;

export {
  /** @type {globalThis.Int32Array} */ Int32Array,
  /** @type {globalThis.SharedArrayBuffer} */ SharedArrayBuffer,
  /** @type {globalThis.Atomics.notify} */ notify,
  /** @type {globalThis.Atomics.wait} */ wait,
  /** @type {globalThis.Atomics.waitAsync} */ waitAsync,
  /** @type {globalThis.postMessage} */ postMessage,
  ignore,
};
