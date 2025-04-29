import { SharedArrayBuffer, native } from './sab.js';

import nextResolver from 'next-resolver';

import BROADCAST_CHANNEL_UID from './bid.js';

const { isArray } = Array;
const { isView } = ArrayBuffer;
const { defineProperty, values } = Object;

let resgiter = () => {};

if (!native) {
  globalThis.SharedArrayBuffer = SharedArrayBuffer;

  const [next, resolve] = nextResolver();
  const views = new Map;

  // Web Worker
  if ('importScripts' in globalThis) {
    const find = function (array) {
      for (let i = 0; i < array.length; i++) {
        const details = interceptSAB.call(this, array[i]);
        if (details) return details;
      }
    };

    const interceptSAB = function (data) {
      if (data && typeof data === 'object' && !this.has(data)) {
        this.add(data);
        if (isView(data)) {
          if (data.buffer instanceof SharedArrayBuffer) {
            const id = ids++;
            views.set(data, id);
            return [UID, id, data];
          }
        }
        else return find.call(this, isArray(data) ? data : values(data));
      }
    }

    const interceptor = method => function (data, ...rest) {
      const wait = interceptSAB.call(new Set, data);
      method.call(this, wait ? [...wait, data] : data, ...rest);
    };

    globalThis.postMessage = interceptor(globalThis.postMessage);

    const { prototype } = globalThis.MessagePort;
    prototype.postMessage = interceptor(prototype.postMessage);

    const [bootstrap, promise] = next();
    addEventListener(
      'message',
      event => {
        resolve(bootstrap, event.data);
        event.stopImmediatePropagation();
        event.preventDefault();
      },
      { once: true }
    );

    const { wait } = Atomics;
    const { parse, stringify } = JSON;
    Atomics.wait = (view, ..._) => {
      if (view.buffer instanceof SharedArrayBuffer) {
        const xhr = new XMLHttpRequest;
        xhr.open('POST', `${SW}?sabayon`, false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(stringify([UID, views.get(view)]));
        view.set(parse(xhr.responseText));
        views.delete(view);
        return 'ok';
      }
      else return wait(view, ..._);
    };

    const [UID, SW] = await promise;
    let ids = Math.random();
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
        views.set(view, [id, Promise.withResolvers()]);
        defineProperty(event, 'data', { value });
      }
    };

    globalThis.MessageChannel = class MessageChannel extends globalThis.MessageChannel {
      constructor() {
        super();
        this.port1.addEventListener('message', interceptData);
        this.port2.addEventListener('message', interceptData);
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
        this.addEventListener('message', interceptData);
      }
    };

    const { notify } = Atomics;
    Atomics.notify = (view, ..._) => {
      const details = views.get(view);
      if (details) details[1].resolve();
      else notify(view, ..._);
      return 0;
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
            w.addEventListener('statechange', () => ready(r), { once: true });
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
