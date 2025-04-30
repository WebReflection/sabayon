import withResolvers from '@webreflection/utils/with-resolvers';
import nextResolver from 'next-resolver';

import BROADCAST_CHANNEL_UID from './bid.js';

import { SharedArrayBuffer, native } from './sab.js';

const { isArray } = Array;
const { isView } = ArrayBuffer;
const { defineProperty, values } = Object;

let resgiter = () => {};

if (!native) {
  globalThis.SharedArrayBuffer = SharedArrayBuffer;

  const [next, resolve] = nextResolver();
  const views = new Map;

  const addListener = (target, ...args) => {
    target.addEventListener(...args);
  };

  // Web Worker
  if ('importScripts' in globalThis) {
    const find = function (set, array) {
      for (let i = 0; i < array.length; i++) {
        const details = interceptSAB(set, array[i]);
        if (details) return details;
      }
    };

    const interceptSAB = function (set, data) {
      if (data && typeof data === 'object' && !set.has(data)) {
        set.add(data);
        if (isView(data)) {
          if (data instanceof Int32Array && data.buffer instanceof SharedArrayBuffer) {
            const id = ids++;
            views.set(data, id);
            return [UID, id, data];
          }
        }
        else return find(set, isArray(data) ? data : values(data));
      }
    }

    const interceptor = method => function (data, ...rest) {
      if (ready) {
        const wait = interceptSAB(new Set, data);
        method.call(this, wait ? [...wait, data] : data, ...rest);
      }
      else {
        promise.then(() => postMessage(data, ...rest));
      }
    };

    globalThis.postMessage = interceptor(globalThis.postMessage);

    const { prototype } = globalThis.MessagePort;
    prototype.postMessage = interceptor(prototype.postMessage);

    const [bootstrap, promise] = next();
    addListener(
      self,
      'message',
      event => {
        event.stopImmediatePropagation();
        resolve(bootstrap, event.data);
      },
      { once: true }
    );

    // <Atomics Patch>
    let { wait, waitAsync } = Atomics;

    const { parse, stringify } = JSON;

    const Async = value => ({ value, async: true });

    const Request = (view, sync) => {
      const xhr = new XMLHttpRequest;
      xhr.open('POST', `${SW}?sabayon`, sync);
      xhr.send(stringify([UID, views.get(view)]));
      return xhr;
    };

    const Response = (view, xhr) => {
      view.set(parse(xhr.responseText));
      views.delete(view);
      return 'ok';
    };

    Atomics.wait = (view, ..._) => views.has(view) ?
      Response(view, Request(view, false)) :
      wait(view, ..._)
    ;

    Atomics.waitAsync = (view, ..._) => {
      if (views.has(view)) {
        const { promise, resolve } = withResolvers();
        const xhr = Request(view, true);
        xhr.onloadend = () => resolve(Response(view, xhr));
        return Async(promise);
      }
      return waitAsync ?
        waitAsync(view, ..._) :
        Async(import('./wait-async.js').then(
          ({ default: $ }) => $(view, ..._)
        ))
      ;
    };
    // </Atomics Patch>

    let UID, SW, ready = false, ids = Math.random();

    promise.then(data => {
      [UID, SW] = data;
      ready = true;
    });

    resgiter = () => promise;
  }
  // Main
  else {
    const UID = crypto.randomUUID();

    const bc = new BroadcastChannel(BROADCAST_CHANNEL_UID);
    bc.onmessage = async event => {
      const [swid, wid, vid] = event.data;
      if (wid !== UID) return;
      for (const [view, [id, wr]] of views) {
        if (id === vid) {
          await wr.promise;
          views.delete(view);
          let length = view.length;
          while (length-- && !view[length]);
          bc.postMessage([swid, view.slice(0, length + 1)]);
          break;
        }
      }
    };

    const interceptData = event => {
      let { data } = event;
      if (isArray(data) && data.at(0) === UID) {
        const [_, id, view, value] = data;
        views.set(view, [id, withResolvers()]);
        defineProperty(event, 'data', { value });
      }
    };

    globalThis.MessageChannel = class MessageChannel extends globalThis.MessageChannel {
      constructor() {
        super();
        addListener(this.port1, 'message', interceptData);
        addListener(this.port2, 'message', interceptData);
      }
    };

    globalThis.Worker = class Worker extends globalThis.Worker {
      /**
       * @param {string | URL} scriptURL 
       * @param {WorkerOptions} options 
       */
      constructor(scriptURL, options) {
        if (!SW) throw new Error('ServiceWorker not registered');
        super(scriptURL, options).postMessage([UID, SW]);
        addListener(this, 'message', interceptData);
      }
    };

    const { notify } = Atomics;
    Atomics.notify = (view, ..._) => {
      const details = views.get(view);
      if (details) {
        details[1].resolve();
        return 0;
      }
      return notify(view, ..._);
    };

    let SW = '';
    let serviceWorker = null;

    const activate = ({ serviceWorker: s }, id) => {
      let w, c = true;
      s.getRegistration(SW)
        .then(r => (r ?? s.register(SW)))
        .then(function ready(r) {
          c = c && !!s.controller;
          w = (r.installing || r.waiting || r.active);
          if (w.state === 'activated') {
            if (c) resolve(id);
            else location.reload();
          }
          else {
            addListener(w, 'statechange', () => ready(r), { once: true });
          }
        });
    };

    resgiter = src => {
      if (!serviceWorker) {
        SW = new URL(src, location.href).href;
        const [id, promise] = next();
        activate(navigator, id);
        serviceWorker = promise;
      }
      return serviceWorker;
    }
  }
}

export default resgiter;
