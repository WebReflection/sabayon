# sabayon 😋

<sup>**S**hared**A**rray**B**uffer **a**lwa**y**s **on** - how sweet!</sup>

<sup>**Social Media Photo by [You Le](https://unsplash.com/@le_y0u) on [Unsplash](https://unsplash.com/)**</sup>


## Usage

These examples represent a dual-exchange between tha *Main* thread and the *Worker* one.

To see more examples, please check the test folder:

  * [main async-waiting a worker](./test/wait-async/)
  * [worker async-waiting the main](./test/async-wait/)
  * [worker sync-waiting the main](./test/wait/)

Remember to run a local server to test these modules, or check the **[live test page](https://webreflection.github.io/sabayon/test/)**.

##### Worker

```js
import {
  Atomics,
  BigInt64Array,
  Int32Array,
  SharedArrayBuffer,
  addEventListener, // use this to add worker listeners
  postMessage,      // use this to post worker messages
  ignore,           // use this to bypass data parsing
} from 'sabayon/worker';

// intercept things to be notified
addEventListener('message', event => {
  const { handle, complex } = event.data;
  handle[0] = 1;
  // release the waiter
  Atomics.notify(handle, 0);
});

const sab = new SharedArrayBuffer(4);
const view = new Int32Array(sab);

postMessage({
  // will be automatically handled by sabayon
  handle: view,
  // this value is passed AS-IS
  passThrough: ignore({ complex: "data" })
});

// use the async version out of the box
Atomics.waitAsync(view, 0).value.then(result => {
  // result === 'ok'
  console.log('view changed', [...view]);
});

// or use the sync one ... please note:
// sync wait requires serviceWorker option
// when the worker is created on the main thread
Atomics.wait(view, 0);
console.log('view changed', [...view]);
```

##### Main

```js
import {
  Atomics,
  BigInt64Array,
  Int32Array,
  SharedArrayBuffer,
  Worker,
  ignore,           // use this to bypass data parsing
} from 'sabayon/main';

const w = new Worker('./worker.js', {
  type: 'module',
  // optional ServiceWorker to enable sync wait
  // on the Worker side of affairs
  serviceWorker: './sw.js',
});

w.addEventListener('message', event => {
  const { handle, complex } = event.data;
  handle[0] = 1;
  // release the waiter sync or async
  Atomics.notify(handle, 0);
});

const sab = new SharedArrayBuffer(4);
const view = new Int32Array(sab);

postMessage({
  // will be automatically handled by sabayon
  handle: view,
  // this value is passed AS-IS
  passThrough: ignore({ complex: "data" })
});

// on main thread, only waitAsync is possible by standard
Atomics.waitAsync(view, 0).value.then(result => {
  // result === 'ok'
  console.log('view changed', [...view]);
});
```

##### Service Worker

This module comes with a basic, yet handy, *CLI* utility that saves `sabayon/sw` export into a path.

```sh
npx sabayon ./public/sw.js
```

**Please note** that if you have your own Service Worker logic already in place, you can use the `sabayon/sw-listeners` export to simply augment your file:

```js
import { activate, fetch, message } from 'sabayon/sw-listeners';

// Way No #1
// you can either add these listeners first
// as `event.stopImmediatePropagation()` is used
// whenever the `event` is handled
addEventListener('fetch', fetch);
addEventListener('message', message);

// Way No #2
// alternatively, you can use those callbacks
// and eventually do nothing if preventDefault()
// was called via that `event`
addEventListener('fetch', event => {
  fetch(event);
  if (event.defaultPrevented) return;
  // your previously implemented logic
});

addEventListener('message', event => {
  message(event);
  if (event.defaultPrevented) return;
  // your previously implemented logic
});
```

It is still important to add at least both `fetch` and `message` listeners, while `activate` ensures that `event.waitUntil(clients.claim())` is invoked so that workers can bootstrap right after when the `serviceWorker` option is passed along.


<details>
  <summary><strong>Why is this needed?</strong></summary>
  <div markdown=1>

Both [SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) and some [Atomics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics) operations require special headers to work out of the box.

This has been an endless source of pain for various projects, where the suggested solutions can be summarized as such:

  * there is no way around the fact to enable both technologies one needs [special headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy) to have native functionality and performance and this is still the preferred way to use these APIs
  * a *ServiceWorker* based workaround, such as [mini-coi](https://github.com/WebReflection/mini-coi#readme), could be used to automatically enable, whenever it's possible, those headers where it's not possible to change these otherwise (like on *GitHub pages* or other similar hosts)
    * ... and yet, even using *mini-coi* might create friction for edge cases where embedding *YouTube* content or other 3rd party domains might not like augmented headers for their services
  * there is no *polyfill* for any of these primitives, one that can actually be used as "*drop-in*" replacement for all the globals that surround this part of the Web (*SharedArrayBuffer*, *Int32Array*, *Atomics.wait*, *Atomics.waitAsync* and *Atomics.notify*)

This **project goal** is to **enable all of that**, like a polyfill would do, without needing to patch anything at the global context level 🎉

P.S. this module also enables out of the box *Firefox* missing `notifyAsync` via its own logic.

  </div>
</details>

<details>
  <summary><strong>How does this work?</strong></summary>
  <div markdown=1>

Using a minimal runtime feature detection, such as:

```js
try {
  new SharedArrayBuffer(4);
}
catch (polyfillRequired) {
  // the polyfill
}
```

It is possible to detect when the current page is capable of using native features and simply export these without affecting at all performance or standard behavior.

When such constructor does not exist or it fails at allocating anything more than `0` bytes though, a workaround is orchestrated in both the *main* thread and each *worker* created through such *main*, and here is how.

If we remove the *Shared* prefix, it's all about *ArrayBuffer*, and that's indeed how *SAB* class is created:

```js
SharedArrayBuffer = class extends ArrayBuffer {}
```

Once that's done, the only wrappers able to deal with that kind of buffer are *Int32Array* and *BigInt64Array*.

```js
const extend = (Class, SharedArrayBuffer) => class extends Class {
  constructor(value, ...rest) {
    super(value, ...rest);
    if (value instanceof SharedArrayBuffer) {
      // logic to track / recognize these wrappers
      // when postMessage are used to send data
      // and "message" listeners intercept such data
    }
  }
};

BigInt64Array = extend(BigInt64Array, SharedArrayBuffer);
Int32Array = extend(Int32Array, SharedArrayBuffer);
```

There is a little known, yet wonderful, API that is [structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone). Its functionality is used in various APIs such as *IndexedDB* and *postMessage*.

What makes it special and useful for these scenarios is its ability to deal with recursion, which in turns means it's able to send the same reference over the wire only once, still preserving the identity at the receiver side of affairs:

```js
const complexData = { huge: "payload" };

// Worker
// this will send complexData same reference at
// both index 0 and index 1 .data
postMessage([complexData, { data: complexData }]);

// Main
worker.addEventListener('message', event => {
  const [complexData, obj] = event.data;
  // true - no assertion failed
  console.assert(complexData === obj.data);
});
```

Connecting the dots, so far we have a way to recognize and track *views* that are meant to be posted and received around plus a way to intercept such *views* on the other side, using a basic *CHANNEL* based protocol, nothing really too different from the way *MQTT* works.

```js
// main page - ensure a unique channel per page/tab
const CHANNEL = crypto.randomUUID();

// when post message is used and there are views to send
postMessage([CHANNEL, action, views, data])

// views will be a Set of views that is also contained in data
```

On the other side, when these kind of `message` are received, all *views* are temporarily stored so that any *Atomics* operation that would like to `wait`, `waitAsync` or `notify` these *views*, the logic knows these have a unique identifier themselves (that is just a forever increasing `i++`) so that such *view* knows that it should be updated on the other side and *release the lock* after some cleanup.

While this orchestration seems reasonable enough, *Atomics.wait* is a blocking operation that must pause the *worker* until that *view* has been notified at some index on the other side (the *main* thread).

To provide this pause/blocking mechanism we need a way to block the current *worker* until such *view* has been notified ... but we need something not blocked behind the scene to make this happen 🤔

Abusing *XMLHttpRequest* in *sync* mode it is then, so we can *POST* a message with enough details that will produce a pending *Response* until such details are forwarded to any page or tab that is registered and that recognize the unique *CHANNEL*, to then wait for that page to tell us back the *view* has been notified, by sending the *view* content that is then returned as *JSON* response, so that the *worker* can access the `xhr.responseText`, *parse* that array, update the *view* that was waiting to be notified, and finally get out of the `Atomics.wait(view, index)` operation in a 100% *synchronous* fashion that moved asynchronously that Service Worker and one *main* thread in the meanwhile.

**As summary**

  * there is a unique (per page/tab) communication *CHANNEL* that is both sent and intercepted on `message` events, able to orchestrate via *actions* all needed operations on any side of affair
  * there is a mechanism to automatically crawl and track *views* that contain the semi-fake *SharedArrayBuffer* but one can also opt-out via an `ignore` utility
  * there is an asynchronous communication for `Atomics.waitAsync` that just works by updating and awaiting back and forward those *views*
  * there is an optional *Service Worker* where data is posted that can orchestrate blocking-like operations on the *worker* side, when `Atomics.wait` is used instead of *waitAsync*

... and that's pretty much it.

  </div>
</details>

#### Performance

Measured "*on my machine*", these are results passing along a `{ some: 'value', view }` object where the `view` is a `new Int32Array(new SharedArrayBuffer(4))` base ref.

**Native**

  * **waitAsync** from *Main* - use a *Worker* to `notify(...)`: 11ms
  * **waitAsync** from a *Worker* - use *Main* to `notify(...)`: 0.4ms
  * **wait** *sync* from a *Worker* - use *Main* to `notify(...)`: 0.3ms

**Polyfill**

  * **waitAsync** from *Main* - use a *Worker* to `notify(...)`: 12ms <sub><sup>(about the same)</sup></sub>
  * **waitAsync** from a *Worker* - use *Main* to `notify(...)`: 0.8ms <sub><sup>(~2x slower)</sup></sub>
  * **wait** *sync* from a *Worker* - use *Main* to `notify(...)`: 2ms <sub><sup>(~7x slower due *ServiceWorker ↔ Main* roundtrip taking 90% of the time)</sup></sub>

**Note** that due lack of real *SharedArrayBuffer* primitive the memory consumption can be temporarily duplicated on both *Main* and *Workers* but fear not, no leaks happen so this should never be a real-world issue.

#### Caveats

  * the optional **Service Worker**, if *sync* `Atomics.wait(...)` is desired, *MUST* be a local file. It cannot be downloaded as module, even if `sabayon/sw` export exists.
  * **no interrupts** (timeout handlers) possible when in emulation mode. These are complex to implement via *ServiceWorker* and quite possibly not super common out there. If proper headers are used though, everything would work natively without any issue whatsoever.
  * **notify(view, index)** are currently the only supported arguments when running in emulation mode. This is due the inability to make sense of a `count` argument and due the fact *interrupts* don't work so that a `delay` makes little sense. You can still pass these values if you like but in emulation these will be ignored.
