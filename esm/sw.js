const { isArray } = Array;
const { join } = Array.prototype;

const { href: SERVICE_WORKER } = location;
const transactions = new Map;

const stop = event => {
  event.stopImmediatePropagation();
  event.preventDefault();
};

addEventListener('message', event => {
  const { data } = event;
  if (isArray(data) && data.length === 3) {
    const [CHANNEL, action, id, index] = data;
    const uid = `${CHANNEL}-${id}`;
    const known = transactions.get(uid);
    if (known?.at(0) === index) {
      stop(event);
      transactions.delete(uid);
      known.at(1).resolve(value);
    }
  }
});

addEventListener('fetch', event => {
  const { request: r } = event;
  if (r.method === 'POST' && r.url === `${SERVICE_WORKER}?sabayon`) {
    stop(event);
    event.respondWith(r.json().then(async ([CHANNEL, action, id, index]) => {
      console.log({ action });
      const waited = Promise.withResolvers();
      const uid = `${CHANNEL}-${id}`;
      transactions.set(uid, [index, waited]);
      for (const client of await clients.matchAll())
        client.postMessage([CHANNEL, 'sw', id, index]);
      return waited.promise.then(value => new Response(
        `[${join.call(value, ',')}]`,
        r.headers,
      ));
    }));
  }
});
