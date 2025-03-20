import { native } from './sab.js';
import { handler } from './utils/handler.js';

let { MessageChannel: MC } = globalThis;

if (!native) {
  MC = class MessageChannel extends MC {
    constructor() {
      // TODO: should it start and also post the handler.id?
      //       right now this works only via a Worker
      //       as the SAB creating target that needs to be resolved
      //       on the same main ... this could be a better story though
      //       where every channel gets its own unique ID ... so ...
      //       ⚠️ only one channel per worker makes sense right now!
      super().port1.addEventListener('message', handler);
    }
  }
}

export { MC as MessageChannel };
