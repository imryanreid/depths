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

**Not yet live on the domain.** `depths.studio` is registered (Ry confirmed)
but not attached to the Vercel project. Everything in the repo already says
`www.depths.studio`.

## To finish the launch

1. **Ry: attach the domain** — add `depths.studio` + `www.depths.studio` to
   the Vercel project (www as primary; `vercel.json` already 308s the apex).
2. **Merge the Ramps PR** (`add-depths` branch): the manifest id rename
   `shape` → `depths` + the ToolMark figure. Until it merges, this repo's
   `pnpm sync:check` reports drift against Ramps `main` — expected, not a bug.
3. **After both:** flip the manifest entry to `live` with
   `wordmark: "depths.studio"`, `domain: "www.depths.studio"` in Ramps, then
   `git checkout main && git pull && pnpm sync` from Ramps so all four repos
   agree, rebuild + deploy each so every footer and llms.txt lists Depths as
   live.
4. **Verify the agent path against production** with a real no-JS fetch:
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
