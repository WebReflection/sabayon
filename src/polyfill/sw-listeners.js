// (c) Andrea Giammarchi - MIT

import nextResolver from 'next-resolver';

import BROADCAST_CHANNEL_UID from './bid.js';

const { join } = Array.prototype;
const { parse } = JSON;

const [next, resolve] = nextResolver();

export const activate = e => e.waitUntil(clients.claim());
export const install = () => skipWaiting();

const bc = new BroadcastChannel(BROADCAST_CHANNEL_UID);
bc.onmessage = event => resolve.apply(null, event.data);

const url = `${location.href}?sabayon`;
const options = {
  headers: {
    'Content-Type': 'text/plain;charset=utf-8',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': 'Origin',
  },
};
export const fetch = async event => {
  const { request: r } = event;
  if (r.url === url) {
    event.stopImmediatePropagation();
    event.preventDefault();
    switch (r.method) {
      case 'POST': {
        const [swid, promise] = next();
        const resolve = value => new Response(
          `[${join.call(value, ',')}]`,
          options
        );
        event.respondWith(promise.then(resolve, resolve));
        const [wid, vid] = parse(await r.text());
        bc.postMessage([swid, wid, vid]);
        break;
      }
      case 'OPTIONS': {
        event.respondWith(new Response(null, {
          headers: {
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Origin': 'Origin',
          },
        }));
        break;
      }
    }
  }
};
