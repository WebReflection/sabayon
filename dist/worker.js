const{ArrayBuffer:e,Atomics:t,Promise:s}=globalThis,{isArray:r}=Array,{create:a,getPrototypeOf:o,values:n}=Object,c=o(Int32Array),i=a(t),l=({currentTarget:e,type:t,origin:s,lastEventId:r,source:a,ports:o},n)=>e.dispatchEvent(new MessageEvent(t,{data:n,origin:s,lastEventId:r,source:a,ports:o})),p=()=>s.withResolvers();let f=0;const g=new Map,u=(e,t)=>class extends e{constructor(e,...s){super(e,...s),e instanceof t&&g.set(this,[f++,0,p()])}},d=new WeakSet,y=e=>(d.add(e),e),v=e=>null!==e&&"object"==typeof e&&!d.has(e),w=new WeakMap,h=(t,s)=>{if(g.has(t))s.set(t,g.get(t)[0]);else if(!(t instanceof c||t instanceof e))for(const e of n(t))v(e)&&h(e,s)},A=(...e)=>({value:new s((t=>{let s=new Worker("data:application/javascript,onmessage%3De%3D%3EpostMessage(!Atomics.wait(...e.data))");s.onmessage=()=>t("ok"),s.postMessage(e)}))}),k=(e,t)=>{const s=g.get(e),[r,a,{promise:o}]=s;return s[1]=t,[r,o]};let{Int32Array:m,SharedArrayBuffer:b,addEventListener:T,postMessage:E}=globalThis,I=e=>e,M=!0;const j=p();try{new b(4),i.waitAsync||(i.waitAsync=A),j.resolve()}catch(t){const{stringify:s,parse:a}=JSON,o=E,n=T,c=({currentTarget:e,type:t,origin:s,lastEventId:r,source:a,ports:o})=>({currentTarget:e,type:t,origin:s,lastEventId:r,source:a,ports:o}),p=[];let f="",d="";b=class extends e{},m=u(m,b),I=y,i.notify=(e,t)=>{const[s]=(e=>w.get(e))(e);return o([f,1,e,s,t]),0},i.waitAsync=(...e)=>{const[t,s]=k(...e);return{value:s}},i.wait=(e,t,...r)=>{const[n]=k(e,t,...r);o([f,3,n,t]);const c=new XMLHttpRequest;c.open("POST",`${d}?sabayon`,!1),c.setRequestHeader("Content-Type","application/json"),c.send(s([f,n,t]));const i=a(c.responseText);g.delete(e);for(let t=0;t<i.length;t++)e[t]=i[t];return"ok"},n("message",(e=>{if(((e,t)=>{const{data:s}=e,a=r(s)&&(s.at(0)===t||0===s.at(1)&&!t);return a&&(e.stopImmediatePropagation(),e.preventDefault()),a})(e,f)){const[t,s,...r]=e.data;switch(s){case 0:f=t,d=r.at(0)?.serviceWorker||"",d||j.resolve();break;case 1:((e,t,s)=>{for(const[r,[a,o,{resolve:n}]]of g)if(t===a&&s===o){for(let t=0;t<e.length;t++)r[t]=e[t];g.delete(r),n("ok");break}})(...r);break;case 2:{const[t,s]=r;((e,t,s)=>{for(const[s,r]of t)w.set(s,[r,e.currentTarget]);l(e,s)})(e,t,s),M&&p.push([c(e),s]);break}case 3:j.resolve()}}})),T=(e,...t)=>{if(n(e,...t),"message"===e)for(const e of p.splice(0))l(...e)},E=(e,...t)=>o(((e,t)=>{const s=new Map;return v(t)&&h(t,s),s.size?[e,2,s,t]:t})(f,e),...t)}await j.promise,M=!1;export{i as Atomics,m as Int32Array,b as SharedArrayBuffer,T as addEventListener,I as ignore,E as postMessage};
