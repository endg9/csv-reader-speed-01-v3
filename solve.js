// solve.js — JS wrapper for csv3.wasm (v3 transducer).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const wasm = readFileSync(join(dir, "csv3.wasm"));
const { instance } = await WebAssembly.instantiate(wasm, {});
const exp = instance.exports;

export const memory = exp.memory;
export const inputBase = exp.inputBase();
export const outputBase = exp.outputBase();
export const inputCap = exp.inputCap();
export const outputCap = exp.outputCap();
export const memU8 = new Uint8Array(memory.buffer);

const enc = new TextEncoder();
const dec = new TextDecoder();

// Transduce one case's CSV text (already unescaped). Returns the answer JSON.
export function transduce(text, header) {
  const bytes = enc.encode(text);
  memU8.set(bytes, inputBase);
  const outLen = exp.transduce(inputBase, bytes.length, header ? 1 : 0);
  if (outLen < 0) throw new Error("transduce failed: " + outLen);
  return dec.decode(memU8.subarray(outputBase, outputBase + outLen));
}

// Transduce a whole cases.json buffer already in WASM memory at [ptr, ptr+len).
// Returns the output byte length.
export function transduceAll(ptr, len) {
  const outLen = exp.transduceAll(ptr, len);
  if (outLen < 0) throw new Error("transduceAll failed: " + outLen);
  return outLen;
}
export const runAll = transduceAll;

export function outputString(outLen) {
  return dec.decode(memU8.subarray(outputBase, outputBase + outLen));
}
