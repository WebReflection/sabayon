const{ArrayBuffer:e,Atomics:t,Promise:s}=globalThis,{isArray:r}=Array,{create:a,getPrototypeOf:o,values:n}=Object,c=o(Int32Array),i=a(t),l=()=>s.withResolvers();let p=0;const g=new Map,d=(e,t)=>class extends e{constructor(e,...s){super(e,...s),e instanceof t&&g.set(this,[p++,0,l()])}},u=new WeakSet,f=e=>(u.add(e),e),h=(e,t)=>{const{data:s}=e,a=r(s)&&(s.at(0)===t||0===s.at(1)&&!t);return a&&(e.stopImmediatePropagation(),e.preventDefault()),a},v=e=>null!==e&&"object"==typeof e&&!u.has(e),w=new WeakMap,y=(t,s,r)=>{if(g.has(t))s.set(t,g.get(t)[0]);else if(!(t instanceof c||t instanceof e))for(const e of n(t))v(e)&&!r.has(e)&&(r.add(e),y(e,s,r))},m=(...e)=>({value:new s((t=>{let s=new Worker("data:application/javascript,onmessage%3De%3D%3EpostMessage(!Atomics.wait(...e.data))");s.onmessage=()=>t("ok"),s.postMessage(e)}))}),A=(e,t,s)=>{for(const[s,r]of t)w.set(s,[r,e.currentTarget]);(({currentTarget:e,type:t,origin:s,lastEventId:r,source:a,ports:o},n)=>{e.dispatchEvent(new MessageEvent(t,{data:n,origin:s,lastEventId:r,source:a,ports:o}))})(e,s)};let{BigInt64Array:M,Int32Array:k,SharedArrayBuffer:I,Worker:W}=globalThis,E=e=>e,b=!1;const j=e=>({...e,type:"module"});try{new I(4),W=class extends W{constructor(e,t){super(e,j(t))}},i.waitAsync||(i.waitAsync=m)}catch(t){const s=crypto.randomUUID(),r=new Map,a=(e,t,s,...r)=>{e.addEventListener(t,s,...r)},o=({serviceWorker:e},t,o)=>{let n,c=!0;a(e,"message",(e=>{if(h(e,s)){const[t,a,o]=e.data,c=[a,o].join(","),i=e=>{r.delete(c),n.postMessage([s,a,o,e])},p=r.get(c);if(p)i(p);else{const{promise:e,resolve:t}=l();r.set(c,t),e.then(i)}}})),e.getRegistration(t).then((s=>s??e.register(t).then((e=>(e.addEventListener("updatefound",(()=>location.reload())),e))))).then((function t(s){c=c&&!!e.controller,n=s.installing||s.waiting||s.active,"activated"===n.state?c?o():location.reload():a(n,"statechange",(()=>t(s)),{once:!0})}))};E=f,b=!0,i.notify=(e,t)=>{const[a,o]=(e=>w.get(e))(e),n=[a,t].join(","),c=r.get(n);return c?c(e):r.set(n,e),o.postMessage([s,1,e,a,t]),0},i.waitAsync=(e,...t)=>{const[s,r]=((e,t)=>{const s=g.get(e),[r,a,{promise:o}]=s;return s[1]=t,[r,o]})(e,...t);return{value:r}},I=class extends e{},M=d(M,I),k=d(k,I);let n=null;W=class extends W{constructor(e,t){let r=t?.serviceWorker||"";if(r){if(r=new URL(r,location.href).href,t={...t,serviceWorker:r},!n){const{promise:e,resolve:t}=l();o(navigator,r,t),n=e}n.then((()=>super.postMessage([s,3])))}super(e,j(t)),super.postMessage([s,0,t]),a(this,"message",(e=>{if(h(e,s)){const[t,s,...r]=e.data;switch(s){case 1:((e,t,s)=>{for(const[r,[a,o,{resolve:n}]]of g)if(t===a&&s===o){for(let t=0;t<e.length;t++)r[t]=e[t];g.delete(r),n("ok");break}})(...r);break;case 2:A(e,...r)}}}))}postMessage(e,...t){return super.postMessage(((e,t)=>{const s=new Map;return v(t)&&y(t,s,new Set),s.size?[e,2,s,t]:t})(s,e),...t)}}}export{i as Atomics,M as BigInt64Array,k as Int32Array,I as SharedArrayBuffer,W as Worker,E as ignore,b as polyfill};
