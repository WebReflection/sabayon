//@ts-check

let { SharedArrayBuffer: SAB } = globalThis, native = true;

try {
  //@ts-ignore due valid options not recognized
  new SAB(4, { maxByteLength: 8 });
}
catch (_) {
  native = false;
  SAB = /** @type {SharedArrayBufferConstructor} */(
    /** @type {unknown} */(
      class SharedArrayBuffer extends ArrayBuffer {
        get growable() {
          //@ts-ignore due valid property not recognized
          return super.resizable;
        }
        /** @param {number} newLength */
        grow(newLength) {
          //@ts-ignore due valid method not recognized
          super.resize(newLength);
        }
      }
    )
  );
}

export { SAB as SharedArrayBuffer, native };
