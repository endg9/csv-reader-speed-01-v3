// main.ts — entrypoint for the csv-reader-speed-01 v3 entry.
// Zero-copy I/O: the input file is read straight into WASM memory and the
// output is written straight out of it. Runs end-to-end locally with exit 0.
import { openSync, readSync, writeSync, fstatSync, mkdirSync, closeSync } from "node:fs";
import { join } from "node:path";
import { setFlagsFromString } from "node:v8";

setFlagsFromString("--no-incremental-marking");

const { runAll, memory, inputBase, outputBase, inputCap } = await import(
  new URL("./solve.js", import.meta.url).href
);

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? "/input";
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(OUTPUT_DIR, { recursive: true });

const inFd = openSync(join(INPUT_DIR, "cases.json"), "r");
const size = fstatSync(inFd).size;
if (size > inputCap) throw new Error("input too large: " + size);
const memU8 = new Uint8Array(memory.buffer);
readSync(inFd, memU8.subarray(inputBase, inputBase + size), 0, size, 0);
closeSync(inFd);

const outLen = runAll(inputBase, size);
if (outLen < 0) throw new Error("transduce failed: " + outLen);

const outFd = openSync(join(OUTPUT_DIR, "answers.json"), "w");
writeSync(outFd, memU8.subarray(outputBase, outputBase + outLen));
closeSync(outFd);
