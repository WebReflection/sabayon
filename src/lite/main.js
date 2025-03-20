//@ts-check

import { SharedArrayBuffer, native } from './sab.js';
import { handler } from './utils/handler.js';
import { asDescriptorValue, isChannel, create } from './utils/shared.js';

import mitm from './utils/mitm.js';

let {
  Atomics: A,
  Worker: W,
} = globalThis;

if (!native) {
  const _ = mitm(handler);

  let hasServiceWorker = false;

  const register = ({ serviceWorker: s }, sw) => {
    let w, c = true;
    s.addEventListener('message', event => {
      if (isChannel(event.data, handler.id)) {
        const [CHANNEL, id] = event.data;
        const buffer = _.buffer(id);
        _.resolved({ buffer }).then(
          value => {
            w.postMessage(
              [[CHANNEL, id].join(','), new Uint8Array(value)],
              [value]
            );
          }
        );
      }
    });
    s.getRegistration(sw)
      .then(r => (r ?? s.register(sw)))
      .then(function ready(r) {
        c = c && !!s.controller;
        w = (r.installing || r.waiting || r.active);
        if (w.state === 'activated') {
          if (!c) location.reload();
        }
        else
          w.addEventListener('statechange', () => ready(r), { once: true });
      });
  };

  A = create(A, {
    notify: asDescriptorValue((...args) => handler.notify(...args)),
    // TODO: currently only main notifies workers
    // waitAsync: asDescriptorValue((view, index, value, timeout = Infinity) => ({
    //   async: true,
    //   value: waitAsync(view, _)
    // }))
  });

  W = class Worker extends W {
    constructor(scriptURL, ...rest) {
      let sw = rest.at(0)?.serviceWorker || '';
      if (sw) {
        sw = new URL(sw, location.href).href;
        if (!hasServiceWorker) {
          hasServiceWorker = true;
          register(navigator, sw);
        }
      }
      //@ts-ignore
      super(scriptURL, ...rest);
      super.addEventListener('message', handler);
      super.postMessage([handler.id, sw]);
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
