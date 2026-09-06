# NEXT-UP—Depths

> **What this file is for:** Session handoff state—what was most recently
> built, what to do next, and known blockers. Read at the start of a session,
> update at the end. Previous sessions stay as a rolling log so context isn't
> lost across conversations. Not a spec—see [`SPEC.md`](SPEC.md).

## Current state

**v1 built**—the full tool per the approved plan
(https://plan.ref.tools/GZ6efMDSjSt9vG8e): model, presets, URL contract with
warnings, light dial, level ramp, token table with pu/xt, scenarios, four
exports, agent surfaces, 56 tests. `pnpm build && pnpm test` clean.

**Deployed**—Vercel project `depths`, production at
https://depths-delta.vercel.app (the team-scoped alias is SSO-gated; this one
is public). GitHub: https://github.com/imryanreid/depths. Every agent surface
verified against production with real no-JS curls: injection on `/`, head
rewrite on parameterized URLs, `/api/shadows` JSON + text, decode warnings,
the llms.txt family block.

**LIVE at https://www.depths.studio (2026-09-06).** The launch completed
end-to-end: family registration (ramp-generator#25) and the live flip
(ramp-generator#26) merged; DNS points at Vercel from Squarespace's
authoritative nameservers; the apex 308s to www. Every sibling synced,
committed and redeployed (Beeps and this repo straight to main, Motion via
motion-studio#26 and #27 on Ry's blanket go-ahead)—all four llms.txt family
blocks and footers now link Depths as live. Verified with no-JS fetches
against the domain: the page injects the scale, `/api/shadows` answers in
JSON and text. `sync:check` green in all four repos.

## Next

Nothing blocking. The tool is live, the family agrees, and the launch-gap
list below is now clear—next work is whatever Ry points at while iterating.

## Known gaps / deliberate omissions

- **Spread is always 0**—a deliberate simplification, held after review on
  2026-09-06: the ambient layer already does spread's softening job, and every
  added parameter is another thing an agent must understand. SPEC §11.
- **Slider styling** is the one raw-CSS block (`.depths-slider` in
  `index.css`)—vendor pseudo-elements, same class of exception as Ramps'
  `.ramp-picker`.

## Session log

### 2026-09-06 (evening)—containing extreme scales

Ry flagged settings like d=5.75/g=3 throwing 400px shadows over adjacent
levels and the token table. Aligned on the fix before building (his lean,
my rec): a **uniform preview zoom**, never per-card—per-card scaling would
flatten the level progression exactly when it's most extreme, and the ramp's
whole job is comparison at one scale.

- `shadowReach()` in `depths.ts`: offset + blur/2 per side (the penumbra
  straddles the edge—counting full blur made stock Soft zoom to 0.8x, caught
  in verification).
- LevelRamp scales all five cards by one factor when the worst reach exceeds
  a 128px spill budget—calibrated just above stock Dramatic's ~118px so no
  untouched preset ever zooms, with a test holding that line if preset
  numbers change. Continuous, downward from 1 only, stated in the header as
  "preview at 0.34x" only when engaged. True pixel values stay in the labels;
  the zoom is a viewing condition, and nothing machine-readable changes.
- A clipped stage around the grid (negative margins repaid as padding, so
  normal shadows and the hover lift never meet the boundary) guarantees what
  the reach estimate can't; Scenario cells got overflow-hidden for the same
  reason.

### 2026-09-06 (later still)—Ry's first polish pass

Five items from playing with the live tool, one push:

- **Controls restructure**—preset on its own row (so the "edited" note stops
  shoving the row around), the light dial down with the sliders, the whole
  band top-aligned.
- **Level 0 removed from the scale row**—a card demonstrating the absence of
  a shadow was spending a sixth of the row saying nothing. Levels 1–5 remain.
- **Edges went two-mode** (Ry's pick from three options): ink hairlines on
  light, white on dark, same strength curve, still the `k` param and still in
  every export—`edgeLight` added to the agent payload (keys only ever added,
  version stays 1). The toggle moved to the scale section's header as
  Edges Off/On.
- **The tint swatch is now a native color picker**, committing live like the
  sliders; the hex field stays for typing.
- **Em dashes lost their spaces everywhere**—UI copy, docs, exports, agent
  payload. Ry's typography call; recorded in memory as a standing preference.
  (Two lessons: macOS grep's `-Z` means decompress, not `--null`, and zsh
  doesn't word-split unquoted variables—the first two sweep attempts hit
  both.)

### 2026-09-06 (later)—the launch-gap round

All three open candidates shipped in one straight-to-prod push:

- **OG card**—`scripts/build-og.py` (system python; it has Pillow, like
  Motion's). Family lockup left; on the right, five paper cards climbing the
  scale with shadows computed by the real layer recipe on the **Dramatic**
  preset—the one presets.ts itself describes as built for hero moments—at print scale (ratios honest, absolute values ×1.6). `og:image` +
  `twitter:card` wired together, per the head comment's own rule.
- **Light-dial snapping**—a 5° magnet on the eight compass points; Shift
  drags free; arrow keys still step 3°. Verified in the DOM: 87→90, 60 stays,
  133→135, Shift+133→133, 357→0.
- **Native (SwiftUI) export**—fifth tab: `toNative` emits an enum + a
  colorScheme-aware chained-shadow ViewModifier, blur→radius at ÷2 stated in
  the generated header, pressed via `ShapeStyle.shadow(.inner)` behind an
  iOS 16/macOS 13 floor, edges as opacities. The generated file passes
  `xcrun swiftc -typecheck`—compiled, not assumed. 61 tests.

One tooling note for future sessions: a hidden Browser pane freezes
animation-frame-driven UI (AnimatePresence tab swaps appear "stuck"); it is
an artifact of driving an unwatched pane, not a bug—front the tab or force
frames before concluding anything.

## Session log (earlier)

### 2026-08-28—v1 built from scratch

Scaffolded the whole tool from Sound Studio's patterns per the approved plan.
Notable decisions beyond the plan: curve params travel as plain decimals
(`g=1.9`) rather than x100 integers—hand-writable beats compact; the Tailwind
export's `@theme` indirection was verified against the actual Tailwind 4.3
compiler (direct theme values inline into utilities; the indirection resolves
at runtime; the cost is shadow-color composition, stated in the fidelity
note); `-0` from `cos(90°)` was folded back to `+0` in the rounding helpers.
The Ramps-side change (id rename + ToolMark) went out as the `add-depths`
branch from a worktree—the shared `src/shared/` here was synced from that
branch, ahead of Ramps `main` until the PR merges.
