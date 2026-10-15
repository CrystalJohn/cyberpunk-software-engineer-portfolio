# M1 contract — approved Option A

Scope: MissionArchive, its geometry/controller/styles, tests. Preserve all other sections, existing data, covers and native briefing. No deployment. Baseline tag: m1-before-51ea041.

- React owns committed selection; latest-index ref mirrors that state for synchronous input. GSAP owns one continuous visual position (selection tween or drag), intro amount and atmosphere. No per-frame React rendering.
- Default DOM is horizontal native scroll-snap with every project and detail action. Initialization failure, reduced motion, width below 360px or viewport height below 560px use this complete flat experience. No item clones, autoplay, wheel interception or pins.
- On successful initialization only, enable absolute 3D layout. Scene/ancestor opacity stays 1. Fade leaf surfaces, never preserve-3d scene node. Browser comparison required before claiming flattening fixed visually.
- Entry: atmosphere → surface reveal/depth advance, ~860ms, one ScrollTrigger. Input interrupts entry and settles its presentation immediately. Accessible heading stays unchanged.
- Selection: ~760ms power3.inOut from current position, shortest circular route (direction resolves ties). Semantic state commits immediately. Surface emphasis/info interpolate from visual distance. Only committed card's info is focusable in 3D.
- Drag: ignore interactive descendants; 8px intent threshold, vertical dominance preserves native scroll; capture only horizontal intent. Position follows delta without React state per pointermove. Release projects bounded velocity and snaps at most adjacent to nearest visual item; cancel returns committed selection. Suppress only the synthetic click associated with that drag.
- Arrows/Home/End only inside carousel and outside editable elements. Buttons remain usable during animation. If focus would become inert, move to gallery region; modal opening uses existing callback and settles presentation first.
- Exit animates decorative environment only; does not shrink/fade focused cards. Layout fits by width and height; coarse pointers reduce tilt. 44px control targets; 200% zoom and actual touch remain browser checks.
- Resize updates measured geometry; short/reduced branches destroy own engine without losing selection. Restore snapshots of imperative styles/attributes; remove owned observers/listeners/RAF/triggers only. Guard asynchronous imports/fonts after disposal. No global trigger kill.
- Tests: pure geometry and real React DOM interactions with a simulated motion adapter; injected initialization failure; reduced/short mode; interruption/cancel; cleanup. These are not browser/GPU evidence.
