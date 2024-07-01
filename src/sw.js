// (c) Andrea Giammarchi - MIT

import * as events from './sw-listeners.js';

for (const type in events)
  addEventListener(type, events[type]);
