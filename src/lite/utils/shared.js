//@ts-check

import withResolvers from '@webreflection/utils/with-resolvers';

import { SharedArrayBuffer } from '@webreflection/utils/shared-array-buffer';

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
      setPrototypeOf(buffer, SharedArrayBuffer.prototype),
      false
    )
  );
  return 'ok';
};

export {
  asDescriptorValue,
  isArray,
  isChannel,
  isView,
  create,
  defineProperty,
  setPrototypeOf,
  stop,
  waitAsync,
  withResolvers,
};
