# Atomics.wait sync-blocking in Workers

This test runs `Atomics.wait` *sync* / *blocking* in the *Worker* thread which is resolved through the *Main* one via `Atomics.notify` but only **after 3 seconds**.

The usage of `serviceWorker` here is mandatory, but of course if *SharedArrayBuffer* is available out of the box such Service Worker won't be registered or used at all.

[Live Test](https://webreflection.github.io/sabayon/test/long-wait/)
