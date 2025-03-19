//@ts-check

let { SharedArrayBuffer: SAB } = globalThis;

let native = true;

try {
  //@ts-ignore due valid options not recognized
  new SharedArrayBuffer(4, { maxByteLength: 8 });
}
catch (_) {
  native = false;
  SAB = /** @type {SharedArrayBufferConstructor} */(
    /** @type {unknown} */(
      class SharedArrayBuffer extends ArrayBuffer {
        /** @readonly @type {boolean} */
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

export {
  SAB as SharedArrayBuffer,
  native
};
