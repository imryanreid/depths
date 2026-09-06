# PROJECT_MAP — Depths

> **What this file is for:** What every file in this repo does, in plain
> language. Update it whenever files are created, renamed or moved. Not a
> spec — see [`SPEC.md`](SPEC.md) — and not a handoff log, which is
> [`NEXT-UP.md`](NEXT-UP.md).

## Root

| File                              | What it does                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| `index.html`                      | The page shell: title, meta, JSON-LD, icons, OG card tags, the pre-paint theme script.  |
| `middleware.ts`                   | Rewrites `/` (only) to `/api/render`, so agents without JavaScript get a readable page. |
| `vercel.json`                     | One job: apex → www 308 redirect, version-controlled.                                   |
| `vite.config.ts`                  | React + Tailwind plugins, React deduping, `base: "./"` so `dist/` runs from `file://`.  |
| `tsconfig.json`                   | Strict TypeScript, `noEmit`; includes `src`, `api`, `middleware.ts`.                    |
| `package.json`                    | Scripts and dependencies. `build` = llms family block + `tsc` + Vite.                   |
| `.mise.toml`                      | Pins Node 22 and pnpm.                                                                  |
| `.prettierrc` / `.prettierignore` | The family's Prettier setup.                                                            |
| `.git-blame-ignore-revs`          | Formatting-only commits, hidden from blame.                                             |
| `LICENSE`                         | MIT.                                                                                    |

## Docs

| File             | What it does                                                                  |
| ---------------- | ----------------------------------------------------------------------------- |
| `README.md`      | What this is, for people. Share-link examples, dev commands.                  |
| `CLAUDE.md`      | How to work in this repo: conventions, the things easy to break, push policy. |
| `SPEC.md`        | What the tool is and why each decision went the way it did.                   |
| `PROJECT_MAP.md` | This file.                                                                    |
| `NEXT-UP.md`     | Session handoff state and the rolling log.                                    |

## src/

| File        | What it does                                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `main.tsx`  | Mounts the app; removes the server-injected agent block once React is running.                                                                 |
| `App.tsx`   | Owns the config, keeps it in the URL, injects the preview variables, lays out the page. Holds the small `TintField` and `Warnings` components. |
| `index.css` | Imports the shared foundation; the `.depths-slider` range-input restyle.                                                                       |

### src/lib/ (pure, Node-safe, `.js` imports)

| File         | What it does                                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `depths.ts`  | The model: config type, limits, `resolve()` (levels + pressed), `cssValue()` — THE layers-to-CSS serialization — `edgeValue()`, dark boosting. |
| `presets.ts` | The four presets as declarative parameter bundles.                                                                                             |
| `tokens.ts`  | The semantic token table with when/when-not, `resolveTokens()`, `exportedTokens()`.                                                            |
| `params.ts`  | The URL contract: encode (diffs only), decode (defensive), `decodeWarnings`.                                                                   |
| `export.ts`  | The exporters: `toCss`, `toTailwind`, `toDtcg`, `toNative`, `toAgentMarkdown`, `agentPrompt`.                                                  |
| `agent.ts`   | The machine payload (JSON + plain text) both API functions serve; `publicOrigin`.                                                              |
| `site.ts`    | `SITE_URL` — the canonical origin share links are built from.                                                                                  |
| `*.test.ts`  | Vitest suites: model math, URL round-trips, exporter output, payload shape, the no-JS render path.                                             |

### src/components/

| File              | What it does                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `LightSource.tsx` | The signature control: a dial with a draggable light puck; the card in the middle wears the hover shadow.                         |
| `Slider.tsx`      | Labelled range input with a mono readout, for the five curve numbers.                                                             |
| `Picker.tsx`      | The family-styled dropdown (ported from Beeps), used for preset and per-token level.                                              |
| `LevelRamp.tsx`   | The six levels as floating cards; click copies the value.                                                                         |
| `TokenTable.tsx`  | The semantic mapping: level pickers, export checkboxes, copy per row.                                                             |
| `Scenarios.tsx`   | Token previews on the surfaces they're named for — card, dropdown, sticky, modal, toast, pressed. Runs on the exported variables. |
| `AgentData.tsx`   | The always-mounted, height-animated machine-readable block.                                                                       |
| `ExportPanel.tsx` | This tool's formats handed to the shared panel: CSS, Tailwind, DTCG JSON, Native (SwiftUI), Markdown.                             |

### src/shared/

Authored in Ramps Studio, synced byte-for-byte — see its own README. Never
edited here.

## scripts/

| File             | What it does                                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `sync-shared.sh` | Pulls `src/shared/` from Ramps Studio; `--check` diffs and exits non-zero on drift.                                               |
| `build-icons.py` | Renders `public/favicon.svg` + the PNG fallbacks from one description of the stacked-planes shape. Pure stdlib.                   |
| `build-og.py`    | Renders `public/og.png` — the share card, five cards climbing the real scale. Run by hand with the system python (it has Pillow). |

## public/

| File                                                    | What it does                                                                                             |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `llms.txt`                                              | The full agent contract: every parameter, every token, the rules. Family block generated by `pnpm llms`. |
| `robots.txt`                                            | Permissive, addresses agents directly, points at llms.txt.                                               |
| `sitemap.xml`                                           | The one indexable URL.                                                                                   |
| `favicon.svg` / `icon-192.png` / `apple-touch-icon.png` | The stacked-planes mark, generated by `scripts/build-icons.py`.                                          |
| `og.png`                                                | The static share card, generated by `scripts/build-og.py`.                                               |

## api/

| File         | What it does                                                                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `render.ts`  | Serves `index.html` with the scale injected (JSON + visible text) for readers without JavaScript. Ported from Ramps — read its comments before simplifying. |
| `shadows.ts` | The same payload as JSON or plain text (`?format=text`), cacheable forever.                                                                                 |
