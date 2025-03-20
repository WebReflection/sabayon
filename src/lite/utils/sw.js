import { isArray, stop } from './shared';

const url = `${location.href}?sabayon/lite`;

const transactions = new Map;

export const activate = e => e.waitUntil(clients.claim());

export const fetch = event => {
  const { request: r } = event;
  if (r.method === 'POST' && r.url === url) {
    stop(event);
    event.respondWith(
      new Promise(async resolve => {
        const data = await r.json();
        const uid = data.join(',');
        transactions.set(uid, resolve);
        for (const client of await clients.matchAll())
          client.postMessage(data);
      })
      .then(value => new Response(`[${value.join(',')}]`, r.headers))
    );
  }
};

export const install = () => skipWaiting();

export const message = event => {
  const { data } = event;
  if (isArray(data) && data.length === 2) {
    const [uid, view] = data;
    const transaction = transactions.get(uid);
    if (transaction) {
      stop(event);
      transaction(view);
      transactions.delete(uid);
    }
  }
};
