const{ArrayBuffer:e,Atomics:t,Promise:s}=globalThis,{isArray:r}=Array,{create:a,getPrototypeOf:n,values:o}=Object,c=n(Int32Array),i=a(t),f=()=>s.withResolvers();let l=0;const p=new Map,g=(e,t)=>class extends e{constructor(e,...s){super(e,...s),e instanceof t&&p.set(this,[l++,0,f()])}},u=new WeakSet,d=new WeakMap,h=e=>(u.add(e),e),y=(e,t)=>{const{data:s}=e,a=r(s)&&(s.at(0)===t||0===s.at(1)&&!t);return a&&(e.stopImmediatePropagation(),e.preventDefault()),a},v=e=>null!==e&&"object"==typeof e&&!u.has(e),w=t=>t instanceof c||t instanceof e,m=new WeakMap,M=(e,t,s)=>{if(p.has(e))t.set(e,p.get(e)[0]);else if(!w(e))for(const r of o(e))v(r)&&!s.has(r)&&(s.add(r),M(r,t,s))};let k=0;const A=(...e)=>({value:new s((async t=>{const s="/__sabayon_wait_async.js";if(!k){const e=fetch(s,{method:"HEAD"}).then((e=>e.ok),(()=>!1));k=await e?1:-1}const r=new Worker(k<0?"data:application/javascript,onmessage%3De%3D%3EpostMessage(!Atomics.wait(...e.data))":s);r.onmessage=()=>{r.terminate(),t("ok")},r.postMessage(e)}))}),b=(e,t,s)=>{for(const[s,r]of t)m.set(s,[r,e.currentTarget]);(({currentTarget:e,type:t,origin:s,lastEventId:r,source:a,ports:n},o)=>{e.dispatchEvent(new MessageEvent(t,{data:o,origin:s,lastEventId:r,source:a,ports:n}))})(e,s)},W=(e,t)=>{const s=new Map;return v(t)&&M(t,s,new Set),s.size?[e,2,s,t]:t},j=crypto.randomUUID(),{defineProperties:I}=Object,{notify:E,waitAsync:x}=i,D=new Map,S={once:!0},B=e=>({...e,type:"module"}),O=(e,t,s,...r)=>{e.addEventListener(t,s,...r)},P=e=>{if(y(e,j)){const[t,s,...r]=e.data;switch(s){case 1:((e,t,s)=>{for(const[r,[a,n,{resolve:o}]]of p)if(t===a&&s===n){for(let t=0;t<e.length;t++)r[t]=e[t];const t=d.get(r);t&&(d.delete(r),p.delete(t)),p.delete(r),o("ok");break}})(...r);break;case 2:b(e,...r)}}};let{BigInt64Array:T,Int32Array:_,SharedArrayBuffer:R,SharedArrayBuffer:U,SharedWorker:L,Worker:z}=globalThis,H=e=>e,q=!1;if(i.notify=(e,t,...s)=>{const r=(e=>m.get(e))(e);if(r){const[s,a]=r,n=[s,t].join(","),o=D.get(n);return o?o(e):D.set(n,e),a.postMessage([j,1,e,s,t]),0}return E(e,t,...s)},i.waitAsync=(e,...t)=>{if(p.has(e)){const[s,r]=((e,t)=>{const s=p.get(e),[r,a,{promise:n}]=s;return s[1]=t,[r,n]})(e,...t);return{value:r}}return(x||A)(e,...t)},L){const{entries:e}=Object,t=e=>{if(U&&!p.has(e)&&(e instanceof _||e instanceof T)&&e.buffer instanceof U){const t=e.slice(0),s=[l++,0,f()];return p.set(e,s),p.set(t,s),d.set(e,t),t}},s=r=>{const a=[];for(const[n,o]of e(r))if(v(r)){const e=t(o);e?a.push([n,e]):w(r)||s(o)}for(const[e,t]of a)r[e]=t},r=(e,r)=>{if(v(r)){const e=t(r);e?r=e:w(r)||s(r)}return W(e,r)};L=class extends L{constructor(e,t){const{port:s}=super(e,{name:"sabayon",...B(t)}),a=s.postMessage.bind(s);O(s,"message",P),I(s,{postMessage:{configurable:!0,value:(e,...t)=>a(r(j,e),...t)}}).start(),a([j,0,t])}}}try{new R(4),z=class extends z{constructor(e,t){super(e,B(t))}}}catch(t){H=h,q=!0,R=class extends e{},T=g(T,R),_=g(_,R);let s=null;z=class extends z{constructor(e,t){let r=t?.serviceWorker||"";if(r){if(r=new URL(r,location.href).href,t={...t,serviceWorker:r},!s){const{promise:e,resolve:t}=f();(({serviceWorker:e},t,s)=>{let r,a=!0;O(e,"message",(e=>{if(y(e,j)){const[t,s,a]=e.data,n=[s,a].join(","),o=e=>{D.delete(n),r.postMessage([j,s,a,e])},c=D.get(n);if(c)o(c);else{const{promise:e,resolve:t}=f();D.set(n,t),e.then(o)}}})),e.getRegistration(t).then((s=>s??e.register(t))).then((function t(n){a=a&&!!e.controller,r=n.installing||n.waiting||n.active,"activated"===r.state?a?s():location.reload():O(r,"statechange",(()=>t(n)),S)}))})(navigator,r,t),s=e}s.then((()=>super.postMessage([j,3])))}super(e,B(t)),super.postMessage([j,0,t]),O(this,"message",P)}postMessage(e,...t){return super.postMessage(W(j,e),...t)}}}export{i as Atomics,T as BigInt64Array,_ as Int32Array,R as SharedArrayBuffer,L as SharedWorker,z as Worker,H as ignore,q as polyfill};
