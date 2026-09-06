# Elevation & Shadow Generator

**[depths.studio](https://www.depths.studio)**—a six-level shadow scale from
one light source, mapped to semantic tokens, honest about dark mode, and
readable by a coding agent.

Fourth tool in the **Studio Tools** family, after
[ramps.studio](https://www.ramps.studio), [springs.studio](https://www.springs.studio)
and [beeps.studio](https://www.beeps.studio).

## What it does

- Derives a six-level elevation scale—layered key, ambient and optional
  contact shadows—from a draggable light source and three curves.
- Maps the levels to semantic tokens: `--shadow-raised`, `--shadow-hover`,
  `--shadow-sticky`, `--shadow-dropdown`, `--shadow-modal`, `--shadow-toast`,
  plus an inset `--shadow-pressed`.
- States what dark mode actually needs: boosted alphas, hairline `--edge-*`
  borders, and the admission that elevation on a dark page is mostly carried by
  surface color.
- Exports as CSS variables, a Tailwind v4 theme, W3C DTCG design tokens, or
  markdown written for an agent's context.

## Share links

Every scale is a pure function of the URL. The parameters are plain decimals,
documented in [`public/llms.txt`](public/llms.txt)—the same file an agent is
pointed at. Fetching any URL returns the complete scale embedded in the HTML
with no JavaScript required; `/api/shadows` serves the same data as JSON or
plain text.

| Example                  | Meaning                                  |
| ------------------------ | ---------------------------------------- |
| `/?p=crisp`              | The Crisp preset                         |
| `/?a=135`                | Light from the upper-left                |
| `/?d=2&g=2.2&o=15`       | A longer, darker throw                   |
| `/?c=1e2a4a`             | Tinted shadow ink                        |
| `/?pu=modal5&xt=pressed` | Modal moved to level 5, pressed excluded |

## Development

```bash
pnpm install
pnpm dev          # http://localhost:5187
pnpm build        # llms.txt family block + tsc + vite
pnpm test         # vitest, src/lib only
pnpm sync:check   # verify src/shared matches upstream (Ramps Studio)
```

`src/shared/` is authored in Ramps Studio and synced here—don't edit it in
this repo. See [`CLAUDE.md`](CLAUDE.md) for how this repo works, and
[`SPEC.md`](SPEC.md) for what it is and why.

## License

MIT. Fork it, change it, ship it.
