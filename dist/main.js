const{ArrayBuffer:e,Atomics:t,Promise:s}=globalThis,{isArray:r}=Array,{create:a,getPrototypeOf:n,values:o}=Object,c=n(Int32Array),i=a(t),l=()=>s.withResolvers();let p=0;const g=new Map,f=(e,t)=>class extends e{constructor(e,...s){super(e,...s),e instanceof t&&g.set(this,[p++,0,l()])}},u=new WeakSet,d=e=>(u.add(e),e),h=(e,t)=>{const{data:s}=e,a=r(s)&&(s.at(0)===t||0===s.at(1)&&!t);return a&&(e.stopImmediatePropagation(),e.preventDefault()),a},v=e=>null!==e&&"object"==typeof e&&!u.has(e),w=new WeakMap,y=(t,s,r)=>{if(g.has(t))s.set(t,g.get(t)[0]);else if(!(t instanceof c||t instanceof e))for(const e of o(t))v(e)&&!r.has(e)&&(r.add(e),y(e,s,r))},m=(...e)=>({value:new s((t=>{let s=new Worker("data:application/javascript,onmessage%3De%3D%3EpostMessage(!Atomics.wait(...e.data))");s.onmessage=()=>t("ok"),s.postMessage(e)}))}),A=(e,t,s)=>{for(const[s,r]of t)w.set(s,[r,e.currentTarget]);(({currentTarget:e,type:t,origin:s,lastEventId:r,source:a,ports:n},o)=>{e.dispatchEvent(new MessageEvent(t,{data:o,origin:s,lastEventId:r,source:a,ports:n}))})(e,s)};let{BigInt64Array:M,Int32Array:k,SharedArrayBuffer:I,Worker:W}=globalThis,b=e=>e,E=!1;const j=e=>({...e,type:"module"});try{new I(4),W=class extends W{constructor(e,t){super(e,j(t))}},i.waitAsync||(i.waitAsync=m)}catch(t){const s=crypto.randomUUID(),r=new Map,a=(e,t,s,...r)=>{e.addEventListener(t,s,...r)},n=({serviceWorker:e},t,n)=>{let o;a(e,"message",(e=>{if(h(e,s)){const[t,a,n]=e.data,c=[a,n].join(","),i=e=>{r.delete(c),o.postMessage([s,a,n,e])},p=r.get(c);if(p)i(p);else{const{promise:e,resolve:t}=l();r.set(c,t),e.then(i)}}})),e.getRegistration(t).then((s=>s??e.register(t))).then((function e(t){o=t.installing||t.waiting||t.active,"activated"===o.state?n():a(o,"statechange",(()=>e(t)),{once:!0})}))};b=d,E=!0,i.notify=(e,t)=>{const[a,n]=(e=>w.get(e))(e),o=[a,t].join(","),c=r.get(o);return c?c(e):r.set(o,e),n.postMessage([s,1,e,a,t]),0},i.waitAsync=(e,...t)=>{const[s,r]=((e,t)=>{const s=g.get(e),[r,a,{promise:n}]=s;return s[1]=t,[r,n]})(e,...t);return{value:r}},I=class extends e{},M=f(M,I),k=f(k,I);let o=null;W=class extends W{constructor(e,t){let r=t?.serviceWorker||"";if(r){if(r=new URL(r,location.href).href,t={...t,serviceWorker:r},!o){const{promise:e,resolve:t}=l();n(navigator,r,t),o=e}o.then((()=>super.postMessage([s,3])))}super(e,j(t)),super.postMessage([s,0,t]),a(this,"message",(e=>{if(h(e,s)){const[t,s,...r]=e.data;switch(s){case 1:((e,t,s)=>{for(const[r,[a,n,{resolve:o}]]of g)if(t===a&&s===n){for(let t=0;t<e.length;t++)r[t]=e[t];g.delete(r),o("ok");break}})(...r);break;case 2:A(e,...r)}}}))}postMessage(e,...t){return super.postMessage(((e,t)=>{const s=new Map;return v(t)&&y(t,s,new Set),s.size?[e,2,s,t]:t})(s,e),...t)}}}export{i as Atomics,M as BigInt64Array,k as Int32Array,I as SharedArrayBuffer,W as Worker,b as ignore,E as polyfill};
