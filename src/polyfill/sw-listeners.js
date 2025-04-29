// (c) Andrea Giammarchi - MIT

import nextResolver from 'next-resolver';

import BROADCAST_CHANNEL_UID from './bid.js';

const [next, resolve] = nextResolver();
const { parse } = JSON;

export const activate = e => e.waitUntil(clients.claim());
export const install = () => skipWaiting();

const bc = new BroadcastChannel(BROADCAST_CHANNEL_UID);
bc.onmessage = event => resolve.apply(null, event.data);

export const fetch = async event => {
  const { request: r } = event;
  if (r.method === 'POST' && r.url === `${location.href}?sabayon`) {
    event.stopImmediatePropagation();
    event.preventDefault();
    const [swid, promise] = next();
    const resolve = value => new Response(`[${[].join.call(value, ',')}]`, r.headers);
    event.respondWith(promise.then(resolve, resolve));
    const [wid, vid] = parse(await r.text());
    bc.postMessage([swid, wid, vid]);
  }
};
