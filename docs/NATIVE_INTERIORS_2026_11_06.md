# Native house interiors — 6 November 2026

## Scope and current implementation

Real playable Three.js rooms for the original home and 5×4 farmhouse: enter
at the exterior doorway, walk with keyboard/joystick or floor picking, collide
with furniture/walls, use the bed/chest and leave through the threshold, Exit,
Escape or browser Back. Doorway interaction takes priority over nearby NPCs.
The room is rendered only while inside; the outdoor renderer does not draw.
Room meshes are merged and the existing character art/animation is reused.

Seven furniture types (bed, table, chair, chest, plant, lamp, rug), four rotations,
move/remove, three floor and three wall finishes. Purchased items spend trusted
catalog costs once; moving is free and removal refunds the original materials.
Starter furnishings are unpaid and cannot generate resources when removed.
Placement preserves the player's route to the exit. The bed retains existing
night/threat rules. Indoor chests add 1,200 units to the existing farm storage;
removal cannot discard its contents. Enemy destruction salvages paid furniture
and preserves storage overflow rather than silently deleting items.

This first slice is **device single-player only**. Entry refuses an active
network session, mines or enemies. No room commands were added to the server
protocol. Existing four-player outdoor co-op remains a separate unchanged flow.
Shared interiors, room expansions, wallpaper items and World3 are not complete.
Time pauses indoors, explicitly explained in the TR/EN UI.

## Save and rollback contract

- SAVE_VERSION remains 1. No D1/DO schema or identity changes.
- Optional `State.homeDecor` stores only validated room layouts/styles.
- Indoor actor coordinates/path are runtime-only `Engine.interior` data. The
  persistent player remains at the valid outside doorway; reload resumes there.
- Malformed/overlapping layouts and blocked exits reject the save; no silent
  repair, truncation, import or origin migration is performed.
- Actual historical 36b0e16 serialize/deserialize code is exercised by a fixture;
  it retains the optional room payload and existing upgrades. This is NOT proof
  that production b97e099 can read the prior new quest IDs or farmhouse type.
- Reader-first release switch `lib/native-release.ts`: first ship all readers
  with native expansion UI disabled, then activate it in a separate release.
  The disabled release still understands rooms, farmhouse footprints, new
  claimed IDs and interior storage capacity. Home building management also
  exposes existing indoor chest storage when room entry is disabled. That release is the fallback for
  activation. Do not revert the reader additions or return new saves to b97e099.
- Roll back application code only with a normal commit; never roll back/reset
  production databases or player saves. Preserve a save JSON before manual
  intervention. Furnished farmhouses cannot be demolished until emptied.

## Evidence and acceptance limits

Initial full suite: 285/285; two additional checks cover reader-only quest
visibility and read-only indoor position reporting. Final results/release SHAs
are recorded below after execution, not inferred from the initial run.

Real local browser acceptance at desktop, 320×640 portrait and 740×360 plus
568×320 landscape: real 3D room, floor walking, doorway exit, re-entry, browser
Back, paid chair/chest placement, styles, storage transfer and save/reopen.
Reopened save retained the purchased chair and stone/sage finishes. Furniture
ray picking targets its volume rather than the floor behind it. Delayed Dialog
canvas mount and hot-reload context cleanup defects were fixed during this QA.
Small-screen tools scroll vertically without horizontal storage overflow;
controls retain at least 44px height. These are browser viewport checks, not
physical Android, human play-session or WAN multiplayer acceptance.

The first build exceeded the unchanged 3 MB asset budget by 15,680 bytes.
Lossless compression of the three existing PWA PNGs saved 18,100 bytes; decoded
RGBA buffers were compared byte-for-byte. No resolution/color/quality reduction
or dependency/lockfile change. One local build attempt hit Windows EBUSY while
the preview held dist/client; preview processes were stopped before retrying.

## Next order

1. Finish final checks, reader-first publication and live verification.
2. Physical Android input/room editor/long-session acceptance and existing WAN
   four-player check. No claimed phone FPS improvement.
3. Shared interior authority/ownership, explicit compatibility and acceptance
   gates before enabling indoor co-op.
4. Only then opt-in new-world World3/biomes; preserve existing generated worlds
   and all isolated prototypes. Other roadmap requests remain on the master plan.
CrazyGames is frozen for this task; no SDK, package or portal submission work.

## Final verification / release record

Local candidate: Node 22.13.0/npm 10.9.2; typecheck, 287/287 full tests,
production build and four-player Worker/D1/DO/WebSocket runtime passed.
Asset bytes: 2,999,561 / 3,000,000 before the final bed-message-only fix;
18 targeted tests passed after that fix. Reader/activation releases require
their own final build and CI. Injected latency/reconnect/restart, simultaneous
D1 writes, external-revision conflict and shared-sleep replay checks passed.
These local network fixtures are not a WAN acceptance claim.
Publication is still pending; no new-world or CrazyGames work was started.

Reader-base preflight (alpha.4): native UI switch false; 288/288 full tests,
typecheck, production build (2,998,875 bytes) and four-player Worker runtime
passed. Extra regression verifies room data and chest contents through four
players, private bags, server command handling and room reconstruction. Home
building management keeps existing indoor storage accessible during rollback.
No publication claimed until remote CI, Workers Builds and live checks pass.


## Reader base published; activation preflight

Confirmed application fallback: **e56235bef57b0d642adef123b0f1303483c2541d**,
version **1.14.0-alpha.4**. Normal fast-forward main push preserved history.
GitHub verify 42219101949 and Workers Builds
b2c91bd0-2b1a-4bb2-8033-6bc40956305c completed successfully. Live root returned
HTTP 200/alpha.4, canonical https://roamcroft.com, intact CSP and existing
VideoGame/WebApplication/free Offer. Historical workers.dev returned 404.
Local production browser acceptance confirmed the legacy catalog and 20
numbered quests with native UI disabled. Preserve this reader base for rollback.

Alpha.5 activation candidate: native switch true; Node 22.13.0/npm 10.9.2,
typecheck, **288/288 tests**, build **2,999,715 / 3,000,000 bytes**, and full
four-player Worker runtime passed. No dependency versions or production schema
changed. Generated Wrangler retains workers_dev=false and preview_urls=false.
Activation publication/CI/live acceptance is recorded in the final checkpoint;
it is not implied merely by these local checks.
