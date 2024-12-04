# Worker notifying Main

This test runs `Atomics.waitAsync` in the *Main* thread which is resolved through the *Worker* one via `Atomics.notify`.

The usage of `serviceWorker` option is fully optional when `Atomics.wait` is not meant to be used in workers.

[No SW Live Test](https://webreflection.github.io/sabayon/test/wait-async/)

[SW Live Test](https://webreflection.github.io/sabayon/test/wait-async/?sw)
