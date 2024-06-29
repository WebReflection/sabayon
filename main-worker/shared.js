const ACTION_INIT = 0;
const ACTION_READY = 1;
const ACTION_NOTIFY = 2;
const ACTION_WAIT = 3;
const ACTION_SW = 4;

const { ArrayBuffer } = globalThis;
const { isArray } = Array;
const { getPrototypeOf, values } = Object;

const TypedArray = getPrototypeOf(Int32Array);

const dispatch = ({ type, origin, lastEventId, source, ports }, data) => dispatchEvent(
  new MessageEvent(type, { data, origin, lastEventId, source, ports })
);

let id = 0;
const views = new Map;
const extend = (Class, SharedArrayBuffer) => class extends Class {
  constructor(value, ...rest) {
    super(value, ...rest);
    if (value instanceof SharedArrayBuffer)
      views.set(this, [id++, 0, Promise.withResolvers()]);
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
const transferViews = (data, transfer) => {
  if (views.has(data))
    transfer.set(data, views.get(data)[0]);
  else if (!(data instanceof TypedArray || data instanceof ArrayBuffer)) {
    for (const value of values(data)) {
      if (isObject(value))
        transferViews(value, transfer);
    }
  }
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/waitAsync#browser_compatibility
const waitAsyncPatch = (buffer, index) => ({
  value: new Promise(resolve => {
    // encodeURIComponent('onmessage=e=>postMessage(!Atomics.wait(...e.data))')
    let w = new Worker('data:application/javascript,onmessage%3De%3D%3EpostMessage(!Atomics.wait(...e.data))');
    w.onmessage = () => resolve('ok');
    w.postMessage([buffer, index]);
  })
});

const waitAsyncPoly = (view, index) => {
  const value = views.get(view);
  if (!isArray(value)) throw new TypeError('Unable to waitAsync this view');
  value[1] = index;
  return { value: value[2].promise };
};

const actionNotify = (_view, _id, _index) => {
  for (const [view, [id, index, { resolve }]] of views) {
    if (_id === id && _index === index) {
      for (let i = 0; i < _view.length; i++) view[i] = _view[i];
      views.delete(view);
      resolve('ok');
      break;
    }
  }
};

const actionWait = (event, transfer, data) => {
  for (const [view, id] of transfer)
    transferred.set(view, id);
  dispatch(event, data);
};

const postData = (CHANNEL, data) => {
  const transfer = new Map;
  if (isObject(data)) transferViews(data, transfer);
  return transfer.size ? [CHANNEL, ACTION_WAIT, transfer, data] : data;
};

export {
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
};
