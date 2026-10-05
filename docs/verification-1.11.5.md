# 1.11.5 — 5 October 2026

Scope: reduce repeat CPU/buffer work while the camera moves. Balanced quality remains the default. No gameplay, save schema or network protocol changes.

## Measured change

`WorldBatches` previously rewrote every visible matrix and color whenever the quantized camera key changed. It now keeps stable draw slots, swaps the last visible slot into a removed slot, and writes only newly visible/swapped objects. Unchanged visibility does not invalidate shadows. Update ranges accumulate safely until the renderer uploads them; multiple chunk changes in a frame are preserved. GPU upload ranges may still span unchanged slots, so matrix-write reduction is **not** a claim of equivalent GPU bandwidth savings.

CPU benchmark: actual seed 84621 procedural world, 25 chunks / 7,262 source instances; 240 moving orthographic camera positions, 240 warm-up calls then five repetitions (1,200 samples). Old implementation from commit 504e6a2 and new implementation alternated on the same machine. This is a Node CPU benchmark, **not a browser FPS/GPU measurement**. Reproduce current version with `node --experimental-strip-types scripts/benchmark-culling.ts`.

| Run | Mean before/after ms | p95 before/after ms | p99 before/after ms | Maximum before/after ms |
|---|---:|---:|---:|---:|
| 1 | 0.268 / 0.218 | 0.355 / 0.306 | 0.465 / 0.418 | 3.227 / 3.533 |
| 2 | 0.307 / 0.231 | 0.432 / 0.345 | 0.576 / 0.489 | 1.014 / 3.987 |
| 3 | 0.271 / 0.227 | 0.370 / 0.315 | 0.556 / 0.432 | 3.217 / 3.284 |

Each run: 2,912,965 → 60,160 matrix writes (97.9% fewer). Average CPU cost fell 16–25%; maximum spikes did **not** improve. The moving route changed visibility each step, so its shadow invalidation count stayed 1,200; unchanged-visibility behavior is covered separately by regression tests.

## Validation and limits

- Typecheck and 185/185 automated tests passed, including unchanged-view buffer versions, repeated culling/removal/replacement color and transform preservation, buffer growth, streamed terrain, saves, authoritative multiplayer, animal presentation and interpolation metrics.
- Production build and real local Worker runtime checks passed. Four authenticated WebSocket clients exercised 50/100/200/300 ms injected latency, application-message drops, stale/duplicate delivery, reconnect, host termination, Worker restart, save conflicts and shared sleep. These are protocol clients, not four rendered game views or physical TCP packet-loss tests.
- With 300 ms injected latency, actual RealtimeClient RTT was 310.14–312.00 ms and interpolation buffers were 149.65–150.15 ms. This verifies the existing adaptive buffer; this release does not change networking or establish a WAN latency improvement.
- Production browser smoke test at 1280×720: walked 25 tiles across streamed regions and back, rotated the camera and zoomed out; terrain and objects remained visible, balanced quality started by default, and no browser console errors were reported. Observed HUD FPS is not treated as a new FPS benchmark. Physical Android and new 1080p/1440p/4K frame-time measurements were not performed for this patch.
- This update does not establish an overall FPS improvement or solve the earlier ~49 ms streaming spike. No universal frame-rate, zero-freeze, reduced WAN RTT or physical Android performance claim.
