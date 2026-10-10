# KSE WEB-SLINGER — Preview verification

Baseline: `6dfa276f1f98db29ee35ea944f575d5686c7b1c0`.
Latest observed platform commit before this report: `04861dcb4589fba9da354551a104219a679016f2`.
The platform creates commits automatically; this is not a promised final report-inclusive SHA.
No publish/deploy, live writes, dependency changes or auth changes were performed.

## Implemented

Existing Web-Slinger, six IDs (1–6), original kill targets, 18 boss HP, scoring specifications,
player key, progress adapter and leaderboard preserved. Six cached Canvas scenes, recognizable
red/blue animated Spidey and equipment-based enemy silhouettes. Planned combinations, warned
lane changes, three boss phases with three-second shield/open cycles, bounded effects,
fixed 60 Hz simulation, tab-gap suppression, reset state and pointer lifecycle handling.
Endless is available immediately and continuously accelerates.

No identified realistic rooftop image was used. Inspected villa sprites are house/pool build
frames; cinema samples are space, aerial terrain and a faceted logo, not suitable rooftop assets.
All six backgrounds are Canvas artwork. No external asset service or purchases.

## Difficulty

|Stage|Target / lives|Speed multiplier|Wave interval|Planned mechanic|
|---|---|---|---|---|
|1 Bahnhofspassage|8 / 3|1.00|1.70 s|Single grunts, alternating lanes|
|2 Lindener Hafen|12 / 3|1.15|1.50 s|One runner every third wave; lane shift warned 0.7 s ahead|
|3 Containerreihe C|14 / 3|1.25|1.45 s|Alternating tanks (3 hits) and runners|
|4 Linden-Nord|18 / 3|1.40|3.60 s|Coordinated runner/tank/grunt triple waves|
|5 Aegi|22 / 2|1.55|2.30 s|Runner + tank/grunt pairs; warned non-tank lane shifts|
|6 Antennenhochhaus|Boss defeat / 3|1.60|2.80 / 2.33 / 2.00 s|Phases at HP 18–13, 12–7, 6–1; shield/open 3 s each; phase 2 repositioning, phase 3 extra runner|
|Endless|No clearance / 3|1.10 × ramp|2.20 s / ramp, floor 0.55 s|Mixed pairs; ramp = 1 + elapsedSeconds × 0.021|

Fire cooldown is 0.22 s, including repeated clicks. At most 16 active enemies, 64 particles
and 12 web traces. These are implementation bounds, not physical-device performance claims.

## Commands and actual outcomes

|Command / signal|Outcome|
|---|---|
|`bun test src/lib/game`|Exit **0**, 21 passed, 0 failed, 129 assertions; `tests.log`|
|`bunx eslint src/components/game/SpideyGame.tsx src/lib/game/engine.ts src/lib/game/scenery.ts src/lib/game/levels.ts src/lib/game/levels.test.ts src/lib/game/progress.test.ts src/lib/game/bun-test.d.ts`|Exit **0**, no diagnostics; `lint.log`|
|`python3 /tmp/browser/web-slinger/check_game.py`|Exit **0**; six successful actual-input runs, mobile touch/cancel checks; script copied here|
|`git diff --check`|Exit **0**|
|Production command `bun run build` (`vite build`)|**Unrun manually**: environment prohibits manual project builds. Automatic preview build log latest checked: `2026-10-10T22:08:49Z — build OK`. No production-build exit code claimed.|
|Full TypeScript command `bunx tsgo --noEmit`|**Unrun in final verification**: environment prohibits manual project typechecks. A prior empty types log is not treated as exit-code evidence.|
|Full repository lint|Unrun; targeted game lint only|

Unit coverage uses real exported gameplay functions: grunt/runner cannot clear living boss,
17 vs 18 hits, shield immunity, boss breakthrough failure regardless of spare lives, mixed
enemy outcomes, reset, ordinary/endless clearance, planned waves and warnings, exact 600
ticks over 10 seconds at 30/60/144 Hz, tab-gap handling, bounded effects, pointer identity
and cancellation, original progression IDs, and failure/endless persistence calculations.

`progress.test.ts` also imports the **unchanged** real progress adapter with a mocked client;
loads, saves and reads back concrete scores/level and verifies original player key and
upsert conflict target. No network or live ranking entries.

## Browser evidence and limitations

Desktop 1280×1800: six levels completed using real moving-target mouse input; the script reads
React state only to aim, not to kill enemies or change gameplay state. Completion elapsed
simulation times: 13.67, 18.05, 20.32, 21.92, 26.38, 10.25 seconds. This automated aiming is
not a human playability/balance assessment. Endlos starts, pause/close works.

Mobile 390×844 with touch and reduced motion: tap, actual CDP touch start/cancel, firing
reset and pointer release assertions passed; no horizontal overflow. All non-local external
requests were intercepted/aborted. Six save requests were served by an in-memory mock,
then the game was reopened; `save-readback.png` records the visible totals. The browser
readback assertion only checks the totals label; concrete persisted values are asserted
in the adapter unit test. No real authenticated/cloud save or leaderboard write was tested.

An existing site hydration error remains in homepage Marquee/CountUp under mobile reduced
motion (`results.json`), outside authorized game scope. No fix to website files was made.
Unmount closes the game; timer/RAF/listener cleanup is implemented, but a dedicated browser
leak-count assertion was not run. Safari, Firefox, physical phones and long-session soak
tests were not run. Boss breakthrough is tested through shared callbacks, not a separate
browser loss run. These are deliberately not presented as verified.

## Measurements

Headless Chromium, 120 synchronous Canvas render calls per scene, 16 enemies, animation
enabled. Median draw-call submission time approximately **0.20 ms**; p95 **0.50–0.90 ms**;
scene cache construction **4.70–8.00 ms**. See `metrics.json` for per-scene values.
These exclude GPU completion, presentation/compositing and physical-device constraints;
they do not establish FPS or a production performance guarantee.

## Screenshots

- [Bahnhofspassage](screenshots/level-1.png)
- [Hafen](screenshots/level-2.png)
- [Containerlabyrinth](screenshots/level-3.png)
- [Linden-Nord](screenshots/level-4.png)
- [Aegi-Dach](screenshots/level-5.png)
- [Antennenhochhaus](screenshots/level-6.png)
- [Mobile touch](screenshots/mobile-touch.png)
- [Reopened saved totals](screenshots/save-readback.png)

## Changed paths relative to baseline

`src/components/game/SpideyGame.tsx`, `src/components/game/game.css`,
`src/lib/game/engine.ts`, `src/lib/game/scenery.ts`, `src/lib/game/levels.ts`,
`src/lib/game/levels.test.ts`, `src/lib/game/bun-test.d.ts`,
`src/lib/game/progress.test.ts`, `src/lib/game/verification/**`.
Required project bookkeeping only: `AGENTS.md`, `roadmap.md`.
`progress.ts`, dependency files and generated auth storage have an empty baseline diff.

Playable preview: https://id-preview--aeb85946-66c5-45cd-9c1a-15cd8c0ac9cd.lovable.app
Open the existing Web-Slinger corner button. Production was not published.