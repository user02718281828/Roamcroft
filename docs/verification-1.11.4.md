# 1.11.4 verification — 4 October 2026

Scope: balanced quality by default, arrival-based interpolation sizing, visual smoothing of online animals. No resolution selector was added: the earlier 1080p/1440p/4K figures were test viewports, not selectable game settings.

## Changes

- UI and scene default to detailed quality off. Manual enabling still works. Local production browser confirmed the settings switch has value 0; no browser console errors observed.
- Keep 650 ms startup buffering. After 12 snapshots, use p95 arrival-interval variation and gaps in the last 40 accepted snapshots, instead of adding half the RTT and lifetime packet gaps. RTT remains independently measured and displayed. Stale snapshots do not affect the adaptation. Buffer remains bounded 120–650 ms and changes gradually.
- Online animals previously copied each HTTP world snapshot directly into mesh position. A visual follower now blends toward authority, capped at 3 tiles/s and 100 ms elapsed per frame. Heading and gait follow visual motion. Gameplay coordinates, collision, inventory, production and save state remain authoritative. No extrapolation beyond received animal positions. Long outages can cause visual lag; this is not a realtime animal transport migration.

## Validation

- Typecheck, production build and **183/183 tests passed**.
- New tests: stable arrivals at 50/100/300/700 ms RTT converge to 120 ms buffer; jitter expands the buffer; old disruptions age out; stale packets are discarded; animal position steps stay bounded at 30/60/144 Hz and after a long frame, converge at rest and do not mutate authoritative state.
- Four-client simulated 20-second matrix: stable streams reached 120 ms buffer. Loss/jitter/reorder/duplicate streams ended at 243/303/303/308 ms for 50/100/200/300 ms injected RTT. Maximum rendered remote-player step stayed <=0.08 tiles per 10 ms sample. Simulated delivery timestamps now reflect actual queue delivery rather than the send timestamp.
- Real local Worker + four WebSocket tests passed: ACK, duplicates, reconnect, host socket termination, worker restart, shared clock/inventory, concurrent D1 conflict and shared sleep.
- Real RealtimeClient test with injected 300 ms delay: RTT **310.62–310.95 ms**, buffer **151.81–152.15 ms**, visual response 77.56 ms, first ACK 405.77 ms, max tested correction 0 tiles. Prior 1.11.3 run with the same test recorded RTT 311.77–319.83 ms and buffer 257.85–296.81 ms. These are separate local runs, not WAN measurements.
- Message fault injection occurs at application level, not physical TCP packet loss. Four protocol clients were tested; four rendered browser views and live multi-device animal appearance were not tested in this update.

The player's reported ~700 ms value was not reproduced on their actual connection. This change removes redundant render waiting; it does not claim to fix network RTT, all PC stalls, or all animal movement under arbitrary outages. Prior FPS audit limitations still apply.
