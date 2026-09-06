# NEXT-UP — Depths

> **What this file is for:** Session handoff state — what was most recently
> built, what to do next, and known blockers. Read at the start of a session,
> update at the end. Previous sessions stay as a rolling log so context isn't
> lost across conversations. Not a spec — see [`SPEC.md`](SPEC.md).

## Current state

**v1 built** — the full tool per the approved plan
(https://plan.ref.tools/GZ6efMDSjSt9vG8e): model, presets, URL contract with
warnings, light dial, level ramp, token table with pu/xt, scenarios, four
exports, agent surfaces, 56 tests. `pnpm build && pnpm test` clean.

**Deployed** — Vercel project `depths`, production at
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
motion-studio#26 and #27 on Ry's blanket go-ahead) — all four llms.txt family
blocks and footers now link Depths as live. Verified with no-JS fetches
against the domain: the page injects the scale, `/api/shadows` answers in
JSON and text. `sync:check` green in all four repos.

## Next

Nothing blocking. The tool is live and the family agrees. Remaining niceties
are the known gaps below (OG card first, whenever it feels worth a session).

## Known gaps / deliberate omissions

- **No OG image / twitter card** — no asset exists yet; the head comment says
  to add both together. Steal Motion's `build-og.py` pattern.
- **No native (SwiftUI) export** — deferred to v2, see SPEC §2; SwiftUI's
  `.shadow()` is single-layer so a faithful export is a view-modifier stack.
- **Spread is always 0** — a deliberate v1 simplification, SPEC §11.
- **Slider styling** is the one raw-CSS block (`.depths-slider` in
  `index.css`) — vendor pseudo-elements, same class of exception as Ramps'
  `.ramp-picker`.

## Session log

### 2026-08-28 — v1 built from scratch

Scaffolded the whole tool from Sound Studio's patterns per the approved plan.
Notable decisions beyond the plan: curve params travel as plain decimals
(`g=1.9`) rather than x100 integers — hand-writable beats compact; the Tailwind
export's `@theme` indirection was verified against the actual Tailwind 4.3
compiler (direct theme values inline into utilities; the indirection resolves
at runtime; the cost is shadow-color composition, stated in the fidelity
note); `-0` from `cos(90°)` was folded back to `+0` in the rounding helpers.
The Ramps-side change (id rename + ToolMark) went out as the `add-depths`
branch from a worktree — the shared `src/shared/` here was synced from that
branch, ahead of Ramps `main` until the PR merges.
