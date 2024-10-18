# Atomics.wait sync-blocking in Workers - Int

This test runs `Atomics.wait` *sync* / *blocking* in the *Worker* thread which is resolved through the *Main* one via `Atomics.notify`.

The usage of `serviceWorker` here is mandatory, but of course if *SharedArrayBuffer* is available out of the box such Service Worker won't be registered or used at all.

[Live Test](https://webreflection.github.io/sabayon/test/wait/)
