//@ts-check

import { SharedArrayBuffer, native } from '@webreflection/utils/shared-array-buffer';
import { handler } from './utils/handler.js';
import { asDescriptorValue, create } from './utils/shared.js';

import mitm from './utils/mitm.js';

let {
  Atomics: A,
  Worker: W,
} = globalThis;

if (!native) {
  const _ = mitm(handler);

  A = create(A, {
    notify: asDescriptorValue((...args) => handler.notify(...args)),
    // TODO: currently only main notifies workers
    // waitAsync: asDescriptorValue((view, index, value, timeout = Infinity) => ({
    //   async: true,
    //   value: waitAsync(view, _)
    // }))
  });

  W = class Worker extends W {
    constructor(...args) {
      //@ts-ignore
      super(...args);
      super.addEventListener('message', handler);
      super.postMessage(handler.id);
    }
  };
}

export {
  SharedArrayBuffer,
  A as Atomics,
  W as Worker,
  native
};

export { MessageChannel } from './message-channel.js';
