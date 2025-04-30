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
export const fetch = async event => {
  const { request: r } = event;
  if (r.method === 'POST' && r.url === url) {
    event.stopImmediatePropagation();
    event.preventDefault();
    const [swid, promise] = next();
    const resolve = value => new Response(`[${join.call(value, ',')}]`, r.headers);
    event.respondWith(promise.then(resolve, resolve));
    const [wid, vid] = parse(await r.text());
    bc.postMessage([swid, wid, vid]);
  }
};
