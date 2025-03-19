# sabayon/light

Similar taste, way less calorise 😜

- - -

This variant goal is to provide the minimal amount of code needed to have:

  * *workers* able to *waitAsync* from main, when no `Atomics.wait` *sync* option is available
  * create *MessageChannel* direct communication from a Worker willing to use *SharedArrayBuffer*
  * provide a `native` *boolean* info out of *SharedArrayBuffer* where things can be easily different, accordingly with current environment's capabilities

This is somehow **experimental** and it doesn't want to solve all the things (i.e. no *ServiceWorker* fallback at all) and its goal is to be as minimal, and performant, as possible.
