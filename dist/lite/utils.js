let{SharedArrayBuffer:e}=globalThis;try{new SharedArrayBuffer(4,{maxByteLength:8})}catch(r){e=class extends ArrayBuffer{get growable(){return super.resizable}grow(e){super.resize(e)}}}const{isArray:r}=Array,{isView:t}=ArrayBuffer,{create:a,defineProperty:o,setPrototypeOf:s}=Object,f=(e,r=!0)=>({configurable:!0,writable:r,value:e}),i=(e,t)=>r(e)&&2===e.length&&e[0]===t,l=e=>{e.stopImmediatePropagation(),e.preventDefault()},n=(r,t)=>async()=>{const a=await t.resolved(r);return o(r,"buffer",f(s(a,e.prototype),!1)),"ok"},u=()=>Promise.withResolvers();export{f as asDescriptorValue,a as create,o as defineProperty,r as isArray,i as isChannel,t as isView,s as setPrototypeOf,l as stop,n as waitAsync,u as withResolvers};
