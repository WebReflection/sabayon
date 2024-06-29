## Main

  * create a unique *CHANNEL* identifier
  * create a *Worker* extend that:
    * native `postMessage` the *CHANNEL* and any extra details in its *constructor* as array
    * `addEventListener('message', ...rest)` to instantly stop events when the `event.data` is an *Array* and the *CHANNEL* is the first entry of such array. Handle these messages and optionally re-dispatch the event.
    * override the `postMessage` to always send `[CHANNEL, ...rest]`

## Worker (as module)

  * create a *Promise* that resolves once the initialization is completed.
  * `addEventListener('message', ...rest)` to initialize the *CHANNEL* as first received event with `event.data` as *Array* and *CHANNEL* as first entry of such array. Optionally resolve the promise so the importer can add more listeners or do more after.
  * optionally *resolve* the promise once
