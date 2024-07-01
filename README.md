# sabayon 😋

<sup>**S**hared**A**rray**B**uffer **a**lwa**y**s **on** - how sweet!</sup>

#### Background

Both [SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) and some [Atomics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics) operations require special headers to work out of the box.

This has been an endless source of pain for various projects, where the suggested solutions can be summarized as such:

  * there is no way around the fact to enable both technologies one needs [special headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy) to have native functionality and performance and this is still the preferred way to use these APIs
  * a *ServiceWorker* based workaround, such as [mini-coi](https://github.com/WebReflection/mini-coi#readme), could be used to automatically enable, whenever it's possible, those headers where it's not possible to change these otherwise (like on *GitHub pages* or other similar hosts)
    * ... and yet, even using *mini-coi* might create friction for edge cases where embedding *YouTube* content or other 3rd party domains might not like augmented headers for their services
  * there is no *polyfill* for any of these primitives, one that can actually be used as "*drop-in*" replacement for all the globals that surround this part of the Web (*SharedArrayBuffer*, *Int32Array*, *Atomics.wait*, *Atomics.waitAsync* and *Atomics.notify*)

This **project goal** is to **enable all of that**, like a polyfill would do, without needing to patch anything at the global context level 🎉

P.S. this module also enables out of the box *Firefox* missing `notifyAsync` via its own logic.

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

### Caveats

  * the **Service Worker** *MUST* be a local file. It cannot be downloaded as module, even if `sabayon/sw` export exists.
  * **no BigInt64Array** due inability to easily represent these entries via *JSON* when it comes to the *sync* `Atomics.wait(...)`.
  * **no interrupts** possible when in emulation mode. These are complex to implement via *ServiceWorker* and quite possibly not super common out there. If proper headers are used though, everything would work natively without any issue whatsoever.
  * **notify(view, index)** are currently te only supported arguments when running in emulation mode. This is due the inability to make sense of a `count` argument and due the fact *interrupts* don't work so that a `delay` makes little sense. You can still pass these values if you like but in emulation these will be ignored.

#### Performance

Measured "*on my machine*", these are results passing along a `{ some: 'value', view }` object where the `view` is a `new Int32Array(new SharedArrayBuffer(4))` base ref.

**Native**

  * **waitAsync** from *Main* - use a *Worker* to `notify(...)`: 17ms
  * **waitAsync** from a *Worker* - use *Main* to `notify(...)`: 0.4ms
  * **wait** *sync* from a *Worker* - use *Main* to `notify(...)`: 0.3ms

**Polyfill**

  * **waitAsync** from *Main* - use a *Worker* to `notify(...)`: 17ms (about the same)
  * **waitAsync** from a *Worker* - use *Main* to `notify(...)`: 0.8ms (~2x slower)
  * **wait** *sync* from a *Worker* - use *Main* to `notify(...)`: 2ms (~7x slower due *ServiceWorker ↔ Main* roundtrip taking 90% of the time)

**Note** that due lack of real *SharedArrayBuffer* primitive the memory consumption can be temporarily duplicated on both *Main* and *Workers* but fear not, no leaks happen so this should never be a real-world issue.
