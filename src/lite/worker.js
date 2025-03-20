//@ts-check

import { SharedArrayBuffer, native } from './sab.js';
import { Handler } from './utils/handler.js';
import {
  asDescriptorValue,
  create,
  defineProperty,
  stop,
  waitAsync,
  withResolvers,
} from './utils/shared.js';

import mitm from './utils/mitm.js';

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
  I32 = class extends I32 {}
  I64 = class extends I64 {}
}

export {
  SharedArrayBuffer,
  A as Atomics,
  I32 as Int32Array,
  I64 as BigInt64Array,
  native,
  pM as postMessage,
  ready,
};

export { MessageChannel } from './message-channel.js';
