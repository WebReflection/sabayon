import * as events from './utils/sw.js';

for (const type in events)
  addEventListener(type, events[type]);
