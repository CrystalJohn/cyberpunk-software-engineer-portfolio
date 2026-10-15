# M1 implementation and verification — review candidate

Date: 2026-10-15. Branch: `m1/mission-archive-coverflow`. Baseline: `m1-before-51ea041` (`51ea0418131d5d4f24ff37d793c43bd209889a3f`). Review checkpoint tag: `m1-review-ready`.

**Implemented, locally committed for review; NOT browser-verified or deployed. M2/M3 not started.** The production URL remains unchanged. No Sites save/deploy or source push was performed.

## Changes completed

- Reused MissionArchive, original three projects, WebP covers, text, stack and links. No changes to App/native dialog or any other section, global narrative, main theme, global motion hooks or assets.
- Ordinary DOM/CSS now provides a horizontal native scroll-snap project list. All detail actions remain available if motion initialization fails. Absolute 3D layout is enabled only after successful initialization; failed setup rolls back styles and the enhancement attribute.
- GSAP/ScrollTrigger load dynamically behind the enhancement boundary. No new runtime dependency or animation engine. Added **dev-only** happy-dom 21.0.1 and esbuild 0.25.12 for reproducible DOM tests; esbuild was already a Vite transitive dependency.
- React selection and its synchronous event mirror serve buttons, direct selection, keyboard, drag release and detail opening. GSAP owns one continuous pose renderer. Rapid input retargets instead of queuing transitions; wrap route has deterministic tie handling.
- Horizontal pointer intent captures after 8px and follows pointer movement. Vertical/diagonal page gestures remain native. Release uses bounded velocity projection + snapping; cancellation restores committed selection; synthetic drag click suppression does not block subsequent keyboard activation.
- Active emphasis/info and leaf-surface dimming derive from the same visual position. Outer wrap seam fades only the leaf surface. A labeled entry timeline coordinates scan and depth. Exit changes decorative floor/glow only, never shrinks or fades actionable cards.
- `preserve-3d` scene opacity remains 1; entrance fades a separate flat surface. Accessible heading text stays stable. This removes the source-level grouping conflict; **actual browser flattening/rendering outcome remains unresolved**.
- Reduced motion, viewport height below 560px or container width below 360px use full flat mode, preserving selection and every action. Width/coarse-pointer geometry updates live; resizing during drag cancels capture. Initial viewport space is reserved to limit enhancement layout shifts, but actual CLS is not measured.
- Arrows/Home/End are scoped away from editable descendants; selection controls keep focus. Focus moves to the region before a departing action becomes inert. Native dialog behavior is preserved, not reimplemented. Main controls have 44px targets.
- Cleanup cancels own timelines/triggers/observers/listeners/RAF/capture; restores imperative style snapshots and enhancement attribute; guards delayed import/fonts after disposal. GSAP context restores before an initialization error is propagated.

## Checks performed

Environment: Node **v24.19.0**, managed Linux container, React 19.3.0 / GSAP 3.15.0 / Tailwind 4.3.3 from the lockfile. DOM interaction tests use happy-dom with explicit mock geometry, matchMedia/ResizeObserver/pointer capture and a simulated motion adapter. One test separately executes the **real bundled GSAP controller** in that DOM. Neither is a rendering browser.

Commands / raw evidence:

- `npm test` → **10 passed, 0 failed** (`tests.log`). There was no existing test command/suite before M1; these are newly added scoped tests.
- `npm run typecheck` → exit **0** (`typecheck.log`).
- `npm run build` → exit **0** (`build.log`).
- Baseline `npm run build` in an isolated archive of the baseline tag → exit **0** (`baseline-build.log`). No baseline application edits.
- `node scripts/m1-bundle-metrics.mjs <baseline-directory>` → active asset graph only, `bundle-metrics.json`. Stale output hashes were excluded; cleaned generated artifacts retain the active graph.
- `git diff --check` → pass. Content comparison against baseline: App, data/links, global hooks/styles, config and all original artwork bytes unchanged. Runtime dependency declarations unchanged.

| Scenario | Result and actual evidence | Limitation / next check |
| --- | --- | --- |
| Geometry + wrap | PASS: fixture counts 1–8, wide/narrow/coarse parameters, signed ties, bounded snap; pure-function execution | Does not prove visual depth/layout |
| Failed enhancement | PASS: injected factory failure leaves all three actions usable; controls continue selecting | Block actual browser chunk/setup to confirm rendering |
| Buttons/keyboard/direct + rapid reverse | PASS: 10 forward then reverse plus Home/End/arrows share expected state in React DOM | Native key dispatch/render timing not observed in a browser |
| Pointer-following drag + release | PASS: simulated pointer moves change visual adapter position before semantic commit; release snaps | Native touch/scroll arbitration and Safari capture NOT RUN |
| Vertical/cancel/click suppression | PASS: vertical input does not take drag; cancel releases capture; compatible click suppressed, next keyboard action works | Physical touch and pinch zoom NOT RUN |
| Focus/inert | PASS: focus transfers before old action becomes inert; controls keep focus; all fallback actions exposed | No manual screen-reader/axe or actual modal focus restoration pass |
| Reduced/short/narrow live changes | PASS: simulated live reduced change during drag releases capture; state retained; teardown/rebuild tested | Browser media handling, 200% zoom, orientation and content fit NOT RUN |
| Native fallback scroll state | PASS: simulated native track scroll updates selected index and detail callback | Actual scroll-snap geometry/overflow NOT RUN |
| StrictMode | PASS: one effective adapter/observer after double setup; teardown retains unrelated observer | Browser resource/layer counts NOT RUN |
| Real GSAP lifecycle/interrupt | PASS in simulated DOM: instant selection, interrupted retarget, drag position, entry teardown, partial init rollback, style restoration, idempotent destroy; unrelated ScrollTrigger survives | GSAP was executed; rendering was **not** inspected |
| 3D entrance/flattening | SOURCE FIXED / BROWSER NOT RUN: no opacity animation on preserve-3d scene; leaf surfaces receive fades | Record old/new entry in actual browser before declaring visual issue resolved |
| Console, document overflow, layout shift | Browser NOT RUN; no unexpected errors in successful DOM-test output | Inspect console, scrollWidth, traces and screenshots |
| Build/typecheck | PASS at final code state | Not a behavior/visual pass |
| Before/after screenshots/videos | NOT CAPTURED | No supported browser QA capability; no fabricated screenshots |
| Performance/physical phone | NOT RUN | Record representative browser/device, frame/long-task/paint and idle traces |

## Bundle comparison

Active build output, gzipSync bytes, excluding unchanged images:

- Baseline JavaScript: **128,972 B gzip**.
- M1 entry JavaScript: **84,311 B gzip**; lazy controller/GSAP chunk: **46,705 B gzip**; total **131,016 B**, delta **+2,044 B** (~2 KB).
- CSS: **12,430 → 12,869 B gzip**, delta **+439 B**.
- Dependency split changes transfer timing; these numbers are not FPS, GPU cost, TTI or phone-performance measurements. Under the proposed +15 KB motion-logic budget by bundle size only.

## Repairs during verification

- Corrected test bundle externalization of lucide/React (test tooling failure, not product defect).
- Updated a stale test expectation after making detail actions commit their own mission selection; ensured all inputs use that selection.
- Prevented fallback scroll inference when a wide track has no actual horizontal overflow.
- Cancelled a gesture before resize/reduced teardown, tested capture release and state preservation.
- Extended real-GSAP testing to partial initialization rollback; made the context catch internal setup errors before propagating them so context scope can restore normally.
- Corrected bundle measurement to follow HTML/JS references instead of counting stale hashed outputs.

## Remaining review gate

The managed Sites workflow requires `control-browser`, absent in this session. No preview server, browser installation or alternate browser path was started. `BROWSER_QA.md` contains the exact permitted follow-up matrix. Until that run exists, this is an **implementation review candidate**, not a visually accepted or release-ready M1. Do not deploy without user approval.
