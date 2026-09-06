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

**Registered with the family (2026-09-06).**
https://github.com/imryanreid/ramp-generator/pull/25 merged; `pnpm sync` ran
from Ramps main. This repo's `sync:check` is green. Beeps committed the sync
straight to main per its policy; Motion's copy is
https://github.com/imryanreid/motion-studio/pull/26, awaiting Ry (its branch
rule). Motion's main checkout carries the same two files as uncommitted synced
changes — they read as clean automatically once that PR merges and main is
pulled.

**Domain: attached in Vercel, DNS still at Squarespace.** Both hosts are on
the Vercel `depths` project, but the nameservers are Squarespace's and
`www` CNAMEs to `ext-sq.squarespace.com`, so depths.studio still serves a
parking page. Ry needs to update the records in Squarespace DNS (Vercel's
Domains tab shows the exact records — A `76.76.21.21` on the apex, CNAME
`cname.vercel-dns.com` on `www`).

## To finish the launch

1. **Ry: point DNS at Vercel** in Squarespace's domain settings (above), and
   merge https://github.com/imryanreid/motion-studio/pull/26.
2. **Once `www.depths.studio` actually serves this tool:** flip the manifest
   entry to `live` with `wordmark: "depths.studio"`,
   `domain: "www.depths.studio"` in Ramps (branch → preview → merge), then
   `git checkout main && git pull && pnpm sync` from Ramps and commit the sync
   in each sibling (Motion via PR), so every footer and llms.txt lists Depths
   as live.
3. **Verify the agent path against the domain** with a real no-JS fetch:
   `curl 'https://www.depths.studio/?p=crisp' | grep DEPTHS` and
   `curl 'https://www.depths.studio/api/shadows?format=text'`.

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
