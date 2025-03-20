// (c) Andrea Giammarchi - MIT

const { isArray } = Array;

const transactions = new Map;

const stop = event => {
  event.stopImmediatePropagation();
  event.preventDefault();
};

const activate = e => e.waitUntil(clients.claim());

const fetch = event => {
  const { request: r } = event;
  if (r.method === 'POST' && r.url === `${location.href}?sabayon`) {
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

const install = () => skipWaiting();

const message = event => {
  const { data } = event;
  if (isArray(data) && data.length === 4) {
    const [CHANNEL, id, index, view] = data;
    const uid = [CHANNEL, id, index].join(',');
    const transaction = transactions.get(uid);
    if (transaction) {
      stop(event);
      transaction(view);
      transactions.delete(uid);
    }
  }
};

var events = /*#__PURE__*/Object.freeze({
  __proto__: null,
  activate: activate,
  fetch: fetch,
  install: install,
  message: message
});

// (c) Andrea Giammarchi - MIT


for (const type in events)
  addEventListener(type, events[type]);
