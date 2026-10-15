# M1 browser review — NOT RUN in this environment

No preview server or browser was launched: the managed Sites workflow requires control-browser and it is unavailable. Playwright installed in the shared runtime was not used as an alternative path.

In a permitted local browser workflow, run `npm ci`, `npm run dev`, open the displayed local URL and preserve console/trace evidence. These are review steps, not recorded passes.

1. Baseline: checkout `m1-before-51ea041` in an isolated worktree; capture Projects at 1440×900, 390×844, 320×568, 844×390. Do not deploy either branch.
2. M1: same browser/device/viewports. Record entry from above, reverse scroll, side-card selection and controls. Inspect centre dominance, rear depth, seam fade during wrap, card text/action fit and focus outline clipping.
3. Flattening comparison: slow the old entry at fractional opacity; inspect scene/computed style and recording. M1 keeps scene opacity 1 and leaf fades separate. Verify actual perspective remains coherent throughout entry. Mark this unresolved until observed in browser.
4. Rapid input: 10 Next then 10 Previous, mixed input during entry and mid-transition, 3→1 and 1→3, direct jump, open detail before settlement. Confirm title/art/stack/action/dialog refer to intended mission.
5. Drag mouse/touch: slow tracking, fast flick, diagonal/vertical page scroll, tap inactive card, drag outside, pointercancel/multi-touch, pinch zoom. Confirm no accidental briefing opens; native vertical scroll is never captured.
6. Keyboard: Tab all controls, arrows/Home/End in gallery and controls, focus active action then ArrowRight, open/close modal with Escape. Check focus visible, restored opener and restored body scroll. Existing dialog belongs to App and was not rewritten.
7. Reduced motion on load and live toggle during drag/entry; resize below/above 360px width and 560px height, rotate phone, browser zoom 200%. All projects/actions accessible; selection preserved and no replay loop.
8. Failure: block the coverflow-controller chunk or inject a setup failure in a disposable QA host. Every card/action and prev/next must still work in native scroll-snap mode. Also test fonts/images delayed.
9. Console/overflow: no unexpected errors; `document.documentElement.scrollWidth <= document.documentElement.clientWidth`. Native track scroll is allowed. Run axe plus manual focus/reading inspection; do not infer accessibility from axe alone.
10. Lifecycle: StrictMode, mount/unmount/remount, two instances with separate hosts and an unrelated sentinel trigger. Count own triggers, listeners, RAF/capture and restored styles against pre-mount baseline. Test async import completion after unmount.
11. Performance: record browser/OS/device/DPR, reproducible 20-second interaction and settled idle trace, frame/long-task/paint evidence. No claim of 60 FPS or physical iPhone performance from DOM tests.

Expected screenshots/videos are absent, not omitted from a completed browser run. Browser evidence is the remaining gate before release approval.
