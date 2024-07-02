import {
  Atomics,
  Worker,
} from '../../dist/main.js';

const options = { type: 'module', serviceWorker: '../sw.js' };
const w = new Worker('./worker.js', options);

const input = document.getElementById('questions');

w.addEventListener('message', event => {
  const { data: { message, view } } = event;
  if (view) {
    input.value = '';
    input.placeholder = message;
    input.addEventListener(
      'keypress',
      function listener(event) {
        if(event.key === 'Enter') {
          input.removeEventListener(event.type, listener);
          const value = input.value.trim();
          for (let i = 0; i < value.length; i++)
            view[i] = value.charCodeAt(i);
          Atomics.notify(view, 0);
        }
      }
    );
  }
  else {
    document.body.textContent = message;
  }
});
