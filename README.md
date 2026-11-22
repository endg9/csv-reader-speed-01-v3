[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/endg9/csv-reader-speed-01-v3/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/endg9/csv-reader-speed-01-v3/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)

# csv-reader-speed-01-v3 — streaming fused parse+emit WASM SIMD transducer

Bounty: **Read broken CSV files faster, 21 November 2026** — see the [make.fun bounty page](https://make.fun/bounty/csv-reader-speed-01-run-20261121)
(`csv-reader-speed-01-run-20261121`, $100 total, 10 places × $10, closes
2026-11-23 09:42 WIB / 02:42 UTC).

Entry: `solve.js` + `csv3.wasm` (WebAssembly module, AssemblyScript source
`csv3.ts` kept in the build workspace) + `main.ts` (reads
`/input/cases.json` as bytes straight into WASM memory, writes
`/output/answers.json` straight out of it) + `package.json` + `LICENSE`
(MIT, SPDX line). Repo total ~16 KB — far under the 1 MiB cap. Node 22, no
dependencies.

## Approach

A WebAssembly SIMD transducer, rewritten from scratch for v3 as a single
fused streaming pass (v2 parsed the CSV, then re-emitted the JSON in two
passes over JS strings; v3 never materialises the CSV text or the answer
as JS values at all):

- **Zero-copy I/O.** `main.ts` reads the input file with `readSync` directly
  into WASM memory and writes the output with `writeSync` directly from it.
  No `readFileSync`, no `JSON.parse`, no `JSON.stringify`, no text copies.
- **Envelope in WASM.** The module scans `cases.json` itself (SIMD scan for
  `\`/`"`, full escape decoding incl. `\uXXXX` + surrogate pairs), unescapes
  each case's text into a scratch region, and answers it.
- **Fused parse+emit.** Each case's CSV is parsed and its answer JSON emitted
  in one left-to-right pass: SIMD 5-way delimiter scans (`,`/`"`/LF/CR/`\`),
  SIMD quoted-content scans, inline u64 field copies (never `memory.copy`
  per field), clean fields bulk-copied with an overlapping-tail u64 store,
  dirty fields escaped on the fly. Errors go to a side buffer and are emitted
  at the end of the case.
- **Exact csv-reader 1.0.0 semantics**: BOM dropped, CRLF and lone-CR rules,
  `""` → `"`, CR/LF inside quotes → LF, quote junk, stray CR, short/long
  rows, unterminated quotes (literal quote + re-read as unquoted), a record
  of exactly one empty unquoted field skipped, error `line` = the record's
  start line. Verified: practice set 6/6 byte-identical to the reference,
  15,000 random broken-CSV fuzz cases with 0 failures.
