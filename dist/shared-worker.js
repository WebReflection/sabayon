const{ArrayBuffer:e,Atomics:t,Promise:s}=globalThis,{isArray:a}=Array,{create:n,getPrototypeOf:r,values:o}=Object,c=r(Int32Array),i=n(t),f=()=>s.withResolvers();let l=0;const p=new Map,d=(e,t)=>class extends e{constructor(e,...s){super(e,...s),e instanceof t&&p.set(this,[l++,0,f()])}},g=new WeakSet,u=e=>(g.add(e),e),y=(e,t)=>{const{data:s}=e,n=a(s)&&(s.at(0)===t||0===s.at(1)&&!t);return n&&(e.stopImmediatePropagation(),e.preventDefault()),n},w=e=>null!==e&&"object"==typeof e&&!g.has(e),h=new WeakMap,v=(t,s,a)=>{if(p.has(t))s.set(t,p.get(t)[0]);else if(!(t instanceof c||t instanceof e))for(const e of o(t))w(e)&&!a.has(e)&&(a.add(e),v(e,s,a))};let A=0;const m=(...e)=>({value:new s((async t=>{const s="/__sabayon_wait_async.js";if(!A){const e=fetch(s,{method:"HEAD"}).then((e=>e.ok),(()=>!1));A=await e?1:-1}const a=new Worker(A<0?"data:application/javascript,onmessage%3De%3D%3EpostMessage(!Atomics.wait(...e.data))":s);a.onmessage=()=>{a.terminate(),t("ok")},a.postMessage(e)}))}),b=(e,t,s)=>{for(const[a,[n,r,{resolve:o}]]of p)if(t===n&&s===r){for(let t=0;t<e.length;t++)a[t]=e[t];p.delete(a),o("ok");break}},k=(e,t,s)=>{for(const[s,a]of t)h.set(s,[a,e.currentTarget]);(({currentTarget:e,type:t,origin:s,lastEventId:a,source:n,ports:r},o)=>{e.dispatchEvent(new MessageEvent(t,{data:o,origin:s,lastEventId:a,source:n,ports:r}))})(e,s)},M=(e,t)=>{const s=new Map;return w(t)&&v(t,s,new Set),s.size?[e,2,s,t]:t};let{BigInt64Array:E,Int32Array:I,SharedArrayBuffer:j}=globalThis,D=e=>e,P=!1;try{new j(4),i.waitAsync||(i.waitAsync=m)}catch(t){const{defineProperties:s}=Object,a=new WeakMap;addEventListener("connect",(({ports:e})=>{for(const t of e){let e="";const{promise:n,resolve:r}=f(),o=t.postMessage.bind(t);t.addEventListener("message",(s=>{if(y(s,e)){const[n,c,...i]=s.data;switch(c){case 0:e=n,a.set(t,[e,o]),r();break;case 1:b(...i);break;case 2:k(s,...i)}}})),s(t,{postMessage:{configurable:!0,value:(t,...s)=>{n.then((()=>o(M(e,t),...s)))}}}).start(),o(0)}})),j=class extends e{},E=d(E,j),I=d(I,j),D=u,P=!0,i.notify=(e,t)=>{const[s,n]=(e=>h.get(e))(e),[r,o]=a.get(n);return o([r,1,e,s,t]),0},i.waitAsync=(...e)=>{const[t,s]=((e,t)=>{const s=p.get(e),[a,n,{promise:r}]=s;return s[1]=t,[a,r]})(...e);return{value:s}}}export{i as Atomics,E as BigInt64Array,I as Int32Array,j as SharedArrayBuffer,D as ignore,P as polyfill};
