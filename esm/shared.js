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

export {
  ArrayBuffer,
  isArray, isObject,
  views, extend,
  ignoreDirect, ignorePatch,
  transferred, transferViews,
  dispatch,
};
