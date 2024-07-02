# Main notifying Worker

This test runs `Atomics.waitAsync` in the *Worker* which is resolved through the *Main* thread via `Atomics.notify`.

The usage of `serviceWorker` option is fully optional when `Atomics.wait` is not meant to be used in workers.

[No SW Live Test](https://webreflection.github.io/sabayon/test/async-wait/)

[SW Live Test](https://webreflection.github.io/sabayon/test/async-wait/?sw)
