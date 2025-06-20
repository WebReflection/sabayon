import { SharedArrayBuffer } from '@webreflection/utils/shared-array-buffer';
import { defineProperty, isChannel, setPrototypeOf } from './shared.js';

const toBeNotified = new Map;

const find = (o, k) => o[k];

export class Handler {
  constructor(id) {
    this.id = id;
  }
  handleEvent(event) {
    const { currentTarget, data } = event;
    if (isChannel(data, this.id)) {
      const { id, path, value } = data[1];
      const buffer = setPrototypeOf(
        path.reduce(find, value),
        SharedArrayBuffer.prototype
      );
      toBeNotified.set(buffer, [id, currentTarget]);
      defineProperty(event, 'data', { value });
    }
  }
  notify({ buffer }, index, count = Infinity) {
    const [id, port] = toBeNotified.get(buffer);
    toBeNotified.delete(buffer);
    port.postMessage([this.id, { id, value: buffer }], [buffer]);
  }
}

export const handler = new Handler(crypto.randomUUID());
