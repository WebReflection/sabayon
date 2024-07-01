const { isArray } = Array;
const { join } = [];

const transactions = new Map;

const stop = event => {
  event.stopImmediatePropagation();
  event.preventDefault();
};

addEventListener('activate', e => e.waitUntil(clients.claim()));

addEventListener('message', event => {
  const { data } = event;
  if (isArray(data) && data.length === 4) {
    const [CHANNEL, id, index, view] = data;
    const uid = [CHANNEL, id, index].join(',');
    if (transactions.has(uid)) {
      stop(event);
      transactions.get(uid)(view);
      transactions.delete(uid);
    }
  }
});

addEventListener('fetch', event => {
  const { request: r } = event;
  if (r.method === 'POST' && r.url === `${location.href}?sabayon`) {
    stop(event);
    event.respondWith(r.json().then(async data => {
      const { promise, resolve } = Promise.withResolvers();
      const uid = data.join(',');
      transactions.set(uid, resolve);
      for (const client of await clients.matchAll())
        client.postMessage(data);
      return promise.then(value => new Response(
        `[${join.call(value, ',')}]`,
        r.headers,
      ));
    }));
  }
});
