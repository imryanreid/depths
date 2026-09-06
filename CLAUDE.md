# CLAUDE.md — Depths

> **What this file is for:** How we work together on _this_ project — stack,
> conventions, and the rules specific to it. Global preferences live in
> `~/CLAUDE.md`; where the two conflict, this file wins. For what each file
> does, see [`PROJECT_MAP.md`](PROJECT_MAP.md). For where we left off, see
> [`NEXT-UP.md`](NEXT-UP.md). For what is being built and why, see
> [`SPEC.md`](SPEC.md). For the visual language, see
> [`DESIGN-LANGUAGE.md`](../Ramps%20Studio/DESIGN-LANGUAGE.md) in Ramps Studio.

## What this is

A single-page tool that generates a six-level elevation scale of layered
box-shadows from one light source and three curves, maps it to semantic tokens,
and exports it as CSS variables, a Tailwind v4 theme, DTCG design tokens, or
markdown that tells a coding agent which surface gets which shadow.

Fourth tool in the **Studio Tools** family, after
[Ramps Studio](../Ramps%20Studio), [Motion Studio](../Motion%20Studio) and
[Sound Studio](../Sound%20Studio). Public, open source (MIT), and a portfolio
piece.

## Three names, and only three

The split Beeps settled and every tool since follows:

- **Depths** — the brand. `og:site_name`, `llms.txt`, the agent payload, the
  manifest entry, this file's title.
- **Elevation & Shadow Generator** — the product. The in-app `<h1>`.
- **Elevation & shadows** — the shelf label. The manifest `title`, and what the
  switcher and footer directory show.

The repo folder is `Depths Studio` and the manifest id is `depths` — renamed
from the leftover `shape` the day this build started, the last cheap moment
before `llms.txt`'s `current=`, the ToolMark key and `TOOL_ID` froze it. Don't
collapse the three names and don't add a fourth.

## Stack

React 19 · Vite 8 · Tailwind CSS v4 · TypeScript (strict) · Motion · pnpm ·
deployed on Vercel. Same as Sound Studio — no tool-specific packages at all;
shadow math is arithmetic.

**No database, no state, no auth.** Every scale is a pure function of the URL.
Nothing in `api/` may ever read or write persistent state, so every response
stays cacheable forever, and nothing there may become load-bearing for a human
visitor — `base: "./"` is set, so the built site runs opened from a `file://`
URL with no server at all.

## `src/shared/` is not ours to edit

That directory is authored in **Ramps Studio** and copied here byte-for-byte.
Editing it locally means the next sync silently reverts your change — no
conflict, no warning.

```bash
pnpm sync          # pull the latest shared layer from Ramps Studio
pnpm sync:check    # diff only; exits non-zero on drift
```

To change something shared, change it in Ramps Studio and run `pnpm sync` here.
If a shared component needs behaviour specific to this tool, give it a **prop** —
never a branch on which tool is running. `src/shared/` must never import from
`src/lib/` or `src/components/`; one direction only, and that rule is what
keeps the copy mechanical.

Run `pnpm sync:check` before any release. Worktrees go **inside
`Studio Tools/`**, because `scripts/sync-shared.sh` resolves the family by
filesystem path rather than by git.

## Conventions

Inherited from the family, and they matter more here because four repos share
code:

- **Every file opens with a comment block** explaining what it does in plain
  language, in the banner style used across `src/`.
- **Class names go through `cn()`** (`src/shared/utils.ts`) whenever there's a
  conditional. Static class strings can stay inline.
- **Fonts are self-hosted** via Fontsource. Never a font CDN.
- **Math belongs in `src/lib/`**, not in components. Components render; `lib/`
  decides.
- **`src/lib/` and `api/` imports carry explicit `.js` extensions** so the
  Vercel Functions can import them. `src/components/` imports don't.
- **Durations, easings and springs come from `src/shared/motion.ts`.** Never a
  hardcoded timing.

## The things that will be easy to break

**1. One resolve, many readers.** `src/lib/depths.ts` turns a config into a
`ResolvedScale` with every offset, blur and alpha computed, and `cssValue()` is
THE serialization of layers to CSS. Live preview, every export, and the agent
payload all read that. The preview literally runs on the injected variables the
CSS export emits — no consumer recomputes anything, and there is never a second
serialization. The single most likely way this tool ends up lying to people is
a second code path between the preview and the file.

**2. The URL contract.** `?p= a= d= g= b= o= f= y= c= k= pu= xt=` are a public
API — a shared link has to keep working. Document them in `README.md`,
`public/llms.txt`, and the agent payload's REGENERATE block, and change all of
them together. Values are plain decimals, no scaling tables, no base64 — an
agent must be able to hand-write a link from the table in `llms.txt`.

**3. Machine-readability.** Being consumable by agents is a stated goal for
every tool in this family, not a nice-to-have. `robots.txt` stays permissive,
the JSON-LD stays accurate, and the page keeps rendering its full scale as
plain text in the DOM (always mounted, never `display:none` — see
`AgentData.tsx`'s banner). The payload carries `version: 1` with Motion's
stability contract: keys are only ever added.

**4. Export honesty.** Three commitments already made, don't unmake them:
there is **no Figma tab** (Figma variables have no shadow type — the JSON tab
is DTCG for Style Dictionary-class pipelines); the Tailwind export indirects
`@theme` values through runtime variables because Tailwind v4 inlines theme
values into utilities (verified against the compiler — a plain `.dark`
override would be inert); and dark mode is stated as _supported by_ shadows,
not carried by them — the payload's notes point at surface color and Ramps.

**5. The dark-mode edges.** `--edge-*` borders ship in BOTH modes, transparent
in light, so `border: var(--edge-raised)` can be applied unconditionally
without the theme flip shifting layout. Emitting them only under `.dark` would
reintroduce exactly that layout shift.

## Agent consumption is a first-class use case

`middleware.ts` sends `/` to `api/render`, which injects the scale into the
HTML as both JSON and text; `/api/shadows` is the same payload as JSON or
plain text; `/llms.txt` is the contract. Anything touching `api/`,
`src/lib/agent.ts` or `src/lib/params.ts` must be verified with a **real
no-JavaScript fetch** — a browser check proves nothing, because the browser
runs the app, which is the one thing an agent doesn't do. Preview deployments
are SSO-protected, so that verification happens against production or an
unprotected deployment.

## Domain

`depths.studio` is registered and `www.depths.studio` is the canonical host —
`SITE_URL`, `index.html` (canonical, `og:url`, JSON-LD), `public/robots.txt`,
`public/sitemap.xml`, `public/llms.txt` and `vercel.json` all say it. Until Ry
attaches the domain to the Vercel project, the site lives on the project's
`*.vercel.app` URL and the manifest entry upstream stays `status: "soon"`.
When it resolves, flip the manifest (`wordmark`, `domain`, `status: "live"`) in
Ramps Studio and `pnpm sync` — one commit.

## Pushing

**Straight to production, every change** — the Beeps exception, for the same
reason: low visibility, and the gate below is what stands between a bad commit
and the live site. Ry confirmed this policy holds post-launch (2026-09-06,
the day the domain went live): commit to `main`, push, deploy — no branch, no
preview, no waiting to be looked at.

```bash
pnpm build && pnpm test && pnpm sync:check
```

If a deploy goes bad: `vercel rollback` promotes the previous production
deployment immediately, which is faster than fixing forward.

## Ask before

- Adding, removing, or upgrading any dependency.
- Touching `.env` files (there are none — this app needs no secrets).
- Adding state anywhere: a database, a session, a write path.

## Verify before calling it done

```bash
pnpm build && pnpm test && pnpm sync:check
```

`build` runs the llms.txt family block, then `tsc --noEmit`, then Vite. All
three commands must be clean. For visual changes, load the page and check light
_and_ dark — dark is where this tool's honesty story lives, so actually look at
it. For anything touching the agent surface, curl it.
