import { SharedArrayBuffer } from '../sab.js';
import { isArray, isChannel, isView, stop, withResolvers } from './shared.js';

const find = (data, path, set) => {
  if (data != null && typeof data === 'object' && !set.has(data)) {
    if (data instanceof SharedArrayBuffer)
      return { buffer: data, path };
    if (isView(data)) {
      set.add(data);
      return find(data.buffer, path.concat('buffer'), set);
    }
    if (isArray(data)) {
      set.add(data);
      for (let i = 0; i < data.length; i++) {
        const found = find(data[i], path.concat(i), set);
        if (found) return found;
      }
    }
    else if (!(data instanceof Error)) {
      set.add(data);
      for (const key in data) {
        const found = find(data[key], path.concat(key), set);
        if (found) return found;
      }
    }
  }
};

const fixRest = (buffer, rest) => {
  let options = rest.at(-1);
  switch (typeof options) {
    case 'undefined':
    case 'string': {
      rest.push([buffer]);
      break;
    }
    default: {
      if (isArray(options))
        options.push(buffer);
      else if (!options.transfer)
        options.transfer = [buffer];
      else
        options.transfer.push(buffer);
    }
  }
};

export default handler => {
  const resolve = ({ id, value }) => {
    const { buffer, resolve } = ids.get(id);
    ids.delete(id);
    promises.delete(buffer);
    resolve(value);
  };
  const promises = new Map;
  const ids = new Map;
  let id = 0;
  return {
    resolve,
    id: ({ buffer }) => promises.get(buffer).id,
    buffer: id => ids.get(id).buffer,
    resolved: ({ buffer }) => promises.get(buffer).promise,
    listener(event) {
      if (isChannel(event.data, handler.id)) {
        stop(event);
        resolve(event.data[1]);
      }
    },
    send(postMessage, data, rest) {
      const found = find(data, [], new Set);
      if (found) {
        const { resolve, promise } = withResolvers();
        const { buffer, path } = found;
        fixRest(buffer, rest);
        data = [handler.id, { id, path, value: data }];
        promises.set(buffer, { id, promise });
        ids.set(id++, { buffer, resolve });
      }
      postMessage(data, ...rest);
    }
  };
};
