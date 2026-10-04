# PC performance audit — 1 October 2026

These are measured local production-build samples for 1.11.3, not a guarantee for all machines. No network RTT is included in frame-time measurements.

## Method

Windows, Codex in-app Chromium, Three.js WebGL2, detailed quality, actual canvas DPR 1.000000015. EXT_disjoint_timer_query_webgl2 measures GPU rendering asynchronously without blocking. 30-second RAF samples include ordinary autosaves. 1% low is 1000 divided by the mean duration of the slowest ceil(n/100) frames; p95/p99 use nearest-rank frame durations. Paused, hidden, initial loading and the first resume frame are excluded. CPU phases are nested, so their times must not be added together. React function timing excludes JSX reconciliation/commit; long-task observation is separate. GPU times exclude browser compositing.

Fixed seed 84621; normal fixture starts at player 15,19 with 3,600 tiles. Dense fixture adds 24 coops / 72 chickens. Fixtures only run on localhost/127.0.0.1. The day clock and animal movements continue; these samples are not identical GPU replays. Resolution transition immediately precedes the initial 1440p/4K records, so their maximum spikes can include viewport allocation. Baseline captured 30 September; continuation 1 October. Cross-session variability must be considered.

## Initial production baseline (1.11.2 + diagnostics only)

| Scene | Canvas | Average FPS | 1% low | Mean frame ms | p95 | p99 | Max | RAF CPU mean | GPU mean | Draw calls | Triangles |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Normal | 1920×1080 | 107.00 | 42.83 | 9.35 | 14.10 | 20.70 | 34.90 | 3.26 | 6.46 | 60 | 325,992 |
| Normal | 2560×1440 | 71.29 | 25.96 | 14.03 | 21.00 | 27.80 | 76.50 | 3.73 | 10.39 | 60 | 325,992 |
| Normal | 3840×2160 | 36.18 | 10.10 | 27.64 | 34.80 | 55.20 | 194.30 | 4.13 | 21.98 | 60 | 325,992 |
| Dense | 1920×1080 | 78.70 | 44.38 | 12.71 | 20.70 | 21.00 | 28.10 | 11.48 | 7.71 | 453 | 386,960 |

At 1080p, scene synchronization averaged 6.32 ms per invocation (118 calls, p99 10.30, max 12.40). Normal simulation averaged 0.104 ms, NPC 0.054, audio 0.014, minimap 0.197 per invocation, React function computation 0.117. IndexedDB synchronous backup/current cloning averaged 10.85 ms (2 saves, max 15.80); save wall time averaged 17.15 ms and is not CPU time. Dense animal updates averaged 0.239 ms; pathfinding averaged 0.174 ms, p99 0.70; render submission averaged 9.31 ms versus 2.39 ms in the normal scene. Shadow-update submission: normal 2.94 ms, dense 11.29 ms. Normal GPU p95/p99: 7.66/9.62 ms; 4K 27.05/28.53 ms.

Separate Node CPU stress benchmark (72 animals, no browser/GPU): simulation median 0.021 / p95 0.236 / max 1.265 ms; A* median 0.102 / p95 0.301 / max 1.044 ms. This is not FPS evidence.

## Findings

- High-resolution normal scenes are GPU-bound; dense scenes also become CPU draw-submission-bound.
- Rebuilding tile/chunk sets and thousands of string signatures every 250 ms creates recurring CPU spikes.
- Autosave reads and clones the previous full snapshot before cloning it again into backup and cloning current state. Its cost is outside the RAF callback.
- Minimap, base simulation and NPC updates are small in these samples. Changing their semantics or timestep without further evidence is not justified.

The changes below address observed costs. There is no claim that all performance problems are resolved.

## Measured optimization steps

1. Cached tile entries and compared visual fields directly; only rebuild coordinate/chunk sets on a world-window change. CPU-only 1080p sample: 116.18 average FPS / 50.31 1% low, mean 8.61 ms, p95 13.90, p99 14.20, max 41.80. Scene sync 1.12 ms mean / 1.80 p99 / 2.00 max versus 6.32 / 10.30 / 12.40. This sample did not include an autosave (the test fixture inherited a failed-load message); corrected fixture messaging before subsequent runs. Do not attribute the entire FPS gain to this optimization.
2. Draw opaque grass/water, underlying ground and hidden base after props, in front-to-back layer order; hardware early depth rejection skips occluded fragments. No geometry, shadows, texture, antialiasing or DPR reduction. Rotate two IndexedDB snapshots using an atomic head pointer instead of reading and re-cloning the previous full save. Legacy current/backup keys remain readable; first new save keeps legacy current as backup.

| After sync + draw order + save rotation | Canvas | Average FPS | 1% low | Mean frame ms | p95 | p99 | Max | RAF CPU mean | GPU mean | Draw calls | Triangles |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Normal | 1920×1080 | 143.47 | 99.75 | 6.97 | 7.20 | 7.50 | 21.10 | 1.83 | 3.47 | 60 | 325,992 |
| Normal | 2560×1440 | 127.94 | 55.04 | 7.82 | 13.90 | 14.00 | 41.60 | 2.04 | 4.58 | 60 | 325,926 |
| Normal (night) | 3840×2160 | 65.81 | 22.83 | 15.20 | 21.00 | 27.90 | 104.20 | 2.84 | 9.69 | 60 | 325,906 |

Post-change 1080p save clone CPU mean 5.05 ms / max 5.40 (2 saves); wall time mean 13.85 / max 17.40. Post-change 1440p save clone mean 4.25 / max 5.00. These microsecond-quantized browser timers should not be read as hardware-exact CPU-cycle measurements.

Host inventory: Ryzen 5 7640HS, Radeon 760M and RTX 4050 Laptop adapters installed. Actual opt-in WebGL renderer string: `ANGLE (AMD, AMD Radeon(TM) Graphics (0x000015BF) Direct3D11 vs_5_0 ps_5_0, D3D11)`. These are integrated AMD GPU measurements, not RTX 4050 results.

3. Instance articulated animal mesh parts by species while preserving source animation transforms, material, geometry and visibility. In the same initial dense fixture, draw calls fell **453 → 113**, with **386,960 triangles unchanged**. CPU render submission fell **9.31 → 2.77 ms**; shadow-update submission 11.29 → 3.37 ms. New animal matrix batching averaged 0.73 ms (p99 1.60).

| Dense 1080p after animal batching | Average FPS | 1% low | Mean frame ms | p95 | p99 | Max | RAF CPU mean | GPU mean |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Idle + autosave | 143.01 | 82.45 | 6.99 | 7.20 | 7.70 | 20.90 | 4.66 | 3.90 |

4. Cache terrain instance slots by global coordinates, updating only changed slots across streamed window shifts. Use conservative bounds for the four ground layers instead of recomputing 14,400 instance bounds; batch removed chunk compaction. Movement test: 15,19 → 18,44 → 18,19, then one rotation and one zoom-out. Two manually timed 30-second runs are not an identical replay (camera timing/end visibility differs); the recurring scene-sync cost is more informative than total FPS for this step.

| Dense walk 1080p | Average FPS | 1% low | Mean frame ms | p95 | p99 | Max | Scene-sync p99/max | Streaming max | GPU mean |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Before terrain reuse | 141.91 | 58.28 | 7.05 | 7.20 | 8.60 | 48.70 | 21.30 / 31.70 | 14.40 | 3.32 |
| After terrain reuse | 141.94 | 61.88 | 7.05 | 7.20 | 13.80 | 48.50 | 16.60 / 24.90 | 16.90 | 3.33 |

Terrain reuse reduces measured scene-sync spikes but does **not** demonstrate an overall p99 improvement; the frame spike remains. Before/after longest RAF callbacks were 54.40/49.70 ms and observed long tasks 54/50 ms. Culling remains a measurable moving-camera cost (after: mean 0.066 / p99 3.40 / max 6.00 ms).

## Mobile-sized viewport and save checks

844×390 landscape viewport on the same desktop GPU, DPR 1, dense scene after menu switching: average 144.01 FPS, 1% low 123.94, frame mean/p95/p99/max 6.94/7.30/7.70/11.30 ms; RAF CPU mean 3.44, GPU mean 2.32, 116 calls / 437,944 triangles. This is **not** a physical Android performance result. Native menu section selection, settings, crafting and close controls were exercised. Screenshots after streaming showed terrain, river, buildings and animated animals intact.

Initial dense profiling fixture placed some coops over resource tiles; the save validator correctly rejected that synthetic world on reload. All before/after dense timing comparisons above use that same initial fixture. The final fixture clears occupied tiles and now has a save/load regression test after simulation and streaming; normal gameplay validation was not weakened. The fixture correction changes final dense geometry counts, so do not compare its counts directly with the old fixture.

## Remaining limits

- 4K still recorded a 104.20 ms frame and 69.87 ms GPU outlier. Average performance improved; universal 30+ FPS or zero freezes is not established.
- Streaming plus scene synchronization can still create roughly 49 ms frames; amortizing this work across frames without exposing incomplete collision/render state remains future work.
- GPU timing excludes browser composition, and React function timing excludes commit/layout. No OS-level GPU scheduler trace was captured.
- Physical Android, dedicated RTX rendering, thermal throttling and long multi-hour sessions remain unverified. A viewport test cannot establish mobile GPU performance.
- Clock, weather, animals and other OS work vary across runs. These are observed samples, not controlled hardware benchmarks or a guaranteed percentage uplift.

## Release validation

- Typecheck passed; **180/180 automated tests passed**. Includes articulated instance matrices/capacity/culling, terrain matrix coordinates and bounds after far/negative streaming, profiler percentile calculation, old save migration, immutable save snapshots, corrupt-current backup recovery, aborted transaction head preservation, and fixture round-trip.
- Production build passed, 2.70 MB static assets / estimated 1.49 MB compressed transfer.
- Actual browser save → launcher → reload without fixture restored day 4, position 18,19, 72 animals and the 94-item inventory. No save validation bypass.
- After closing/reopening menus and switching bag → farm → crafting, a 1080p 30-second window recorded 140.72 FPS / 64.75 1% low; frame mean/p95/p99/max 7.11/7.10/13.90/41.60 ms. No observed >50 ms long task in that window. Rendering remained 1920×1080 / DPR 1. Paused menu time and first resume frames are excluded from FPS; this does not measure full React commit latency.
- `check:runtime` passed against production Worker code with four authenticated WebSockets, input ACKs, duplicate/reordered messages, message drops, reconnect, abrupt host socket close, worker restart, shared clock, atomic shared inventory operations, concurrent D1 save conflict and shared sleep consensus. Message fault injection is at application level, **not physical TCP packet loss**.

| Four-client local network scenario | RTT p50 ms | RTT p95 ms | Jitter p95 ms | Snapshot Hz |
|---|---:|---:|---:|---:|
| Local baseline | 2.92 | 3.34 | 1.11 | 10.01 |
| Injected 50 ms | 62.36 | 63.09 | 0.88 | 9.91 |
| Injected 100 ms | 125.30 | 126.16 | 0.91 | 9.82 |
| Injected 200 ms | 218.18 | 218.89 | 2.38 | 9.77 |
| Injected 300 ms | 312.53 | 314.03 | 2.83 | 9.63 |
| 300 ms + drops/jitter/reorder/duplicates | 341.32 | 528.55 | 263.54 | 8.61 |

The final fault case injected 25 application-message drops, discarded 12 stale snapshots and observed 15 sequence gaps. Actual RealtimeClient tests at injected 300 ms: RTT 311.77–319.83 ms, interpolation 257.85–296.81 ms, visual prediction response 61.65 ms, first ACK 468.98 ms, maximum tested correction 0 tiles. Shared sleep final-vote ACK 97.89 ms. These protocol tests do not render four browser views and do not establish WAN latency or zero rubberbanding in all environments.
