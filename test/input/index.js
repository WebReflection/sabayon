import {
  Atomics,
  Worker,
} from '../../dist/main.js';

const options = { type: 'module', serviceWorker: '../sw.js' };

const w = new Worker('./worker.js', options);

w.addEventListener('message', event => {
  const { data: view } = event;
  const input = document.createElement('input');
  input.onkeypress = event => {
    if(event.key === 'Enter') {
      input.disabled = true;
      const value = input.value.trim();
      for (let i = 0; i < value.length; i++)
        view[i] = value.charCodeAt(i);
      Atomics.notify(view, 0);
    }
  };
  document.body.replaceChildren(input);
});
