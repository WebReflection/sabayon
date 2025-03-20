//@ts-check


try {
  //@ts-ignore due valid options not recognized
  new SharedArrayBuffer(4, { maxByteLength: 8 });
}
catch (_) {
}

//@ts-check


const { isArray } = Array;

/**
 * @param {MessageEvent} event
 */
const stop = event => {
  event.stopImmediatePropagation();
  event.preventDefault();
};

const url = `${location.href}?sabayon/lite`;

const transactions = new Map;

const activate = e => e.waitUntil(clients.claim());

const fetch = event => {
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

const install = () => skipWaiting();

const message = event => {
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

var events = /*#__PURE__*/Object.freeze({
  __proto__: null,
  activate: activate,
  fetch: fetch,
  install: install,
  message: message
});

for (const type in events)
  addEventListener(type, events[type]);
