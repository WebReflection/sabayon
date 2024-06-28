import {
  ArrayBuffer,
  isArray, isObject,
  views, extend,
  ignoreDirect, ignorePatch,
  transferred, transferViews,
  dispatch,
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

  firstContact.resolve();

  // except for Firefox ...
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/waitAsync#browser_compatibility
  if (!waitAsync) {
    waitAsync = (buffer, index) => ({
      value: new Promise(resolve => {
        wait(buffer, index);
        resolve('ok');
      })
    });
  }
}
catch (_) {
  const { parse, stringify } = JSON;

  const stop = event => {
    event.stopImmediatePropagation();
    event.preventDefault();
  };

  const _postMessage = postMessage;

  let init = true;
  let CHANNEL = '';
  let SERVICE_WORKER = '';

  ignore = ignorePatch;

  notify = (view, index) => {
    if (!transferred.has(view))
      throw new TypeError('Unable to notify this view');
    _postMessage([CHANNEL, 'notify', view, transferred.get(view), index]);
    return 0;
  };

  postMessage = (data, ...rest) => {
    const transfer = new Map;
    if (isObject(data)) transferViews(data, transfer);
    _postMessage(
      transfer.size ? [CHANNEL, 'wait', transfer, data] : data,
      ...rest
    );
  };

  wait = (view, index) => {
    console.log({ CHANNEL, SERVICE_WORKER });
    const xhr = new XMLHttpRequest;
    xhr.open('POST', `${SERVICE_WORKER}?sabayon`, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(stringify([CHANNEL, 'sw', views.get(view)[0], index]));
    console.log({ responseText: xhr.responseText });
    const buffer = parse(xhr.responseText);
    for (let i = 0; i < buffer.length; i++) view[i] = buffer[i];
    return 'ok';
  };

  waitAsync = (buffer, index) => ({
    value: new Promise(resolve => {
      wait(buffer, index);
      resolve('ok');
    })
  });

  SharedArrayBuffer = class extends ArrayBuffer {}
  Int32Array = extend(Int32Array, SharedArrayBuffer);

  addEventListener('message', event => {
    const { data } = event;
    if (isArray(data)) {
      if (init) {
        stop(event);
        init = !init;
        [CHANNEL, SERVICE_WORKER] = data;
        if (!SERVICE_WORKER) firstContact.resolve();
      }
      else if (data.at(0) !== CHANNEL) return;
      else {
        stop(event);
        const [_, action, ...rest] = data;
        switch (action) {
          case 'wait': {
            const [transfer, object] = rest;
            for (const [view, id] of transfer)
              transferred.set(view, id);
            dispatch(event, object);
            break;
          }
          case 'ready': {
            firstContact.resolve();
            break;
          }
          default:
            throw new TypeError(action);
        }
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
