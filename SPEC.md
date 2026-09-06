# SPEC—Depths

> **What this file is for:** What the tool is, what it generates, and why each
> decision went the way it did. The contract the build is measured against. Not
> a file inventory—see [`PROJECT_MAP.md`](PROJECT_MAP.md)—and not a session
> log, which is [`NEXT-UP.md`](NEXT-UP.md). For the family's visual language
> see [`DESIGN-LANGUAGE.md`](../Ramps%20Studio/DESIGN-LANGUAGE.md); for how to
> work in this repo see [`CLAUDE.md`](CLAUDE.md).

Fourth tool in the **Studio Tools** family, after
[Ramps](../Ramps%20Studio), [Motion](../Motion%20Studio) and
[Beeps](../Sound%20Studio). Ships at **depths.studio**. Listed in the manifest
as **Depths—"Elevation & shadows"**.

---

## 1. The thesis

Color has ramps and tokens. Motion has curves and durations. Shadows are still
five `box-shadow` strings someone copied from five different places, at five
inconsistent angles, with no rule about which surface gets which. The result is
the most common tell of an unsystematized UI: a dropdown lit from the left over
a card lit from above.

Coding agents have it worse. An agent asked to "add a shadow to the dropdown"
has no vocabulary—no scale to place the dropdown on, no rule that a menu sits
below a modal, no answer for what happens in dark mode. It pastes whatever
Stack Overflow shadow it saw most.

Depths generates the system: one light source, a geometric scale, semantic
names, and dark-mode values that state their own limits. Two commitments
follow, and everything else in this document is downstream of them:

**Every level is derived, never authored.** A level is a pure function of the
light angle, a base distance, and three curves (growth, blur ratio, opacity
falloff). That is why the whole scale fits in a URL, why dragging the light
re-aims every shadow at once, and why an agent can reason about the system
rather than about eight unrelated strings.

**Dark mode is honest, not equivalent.** Shadows barely read on dark surfaces
and no parameter fixes that. The dark values boost alpha (x1.5, capped 0.85)
and pair each token with a hairline `--edge-*` border, and the exports say
plainly that elevation on a dark page is mostly carried by surface color—pointing at Ramps for the surface ramp. Shipping equal-looking light/dark
values would be the quiet lie this family refuses to tell.

## 2. Scope

**v1 ships:** the shadow model (six levels, key/ambient/contact layers); four
presets; the draggable light source; the semantic token table with per-token
level overrides (`pu`) and exclusions (`xt`); tinted shadow ink; the two
dark-mode strategies; the preview scenarios; URL state with decode warnings;
four exports (CSS, Tailwind v4, DTCG JSON, agent markdown); and the agent
surfaces (`api/render`, `/api/shadows`, `llms.txt`, JSON-LD, the on-page
block).

**Shipped after launch (2026-09-06):** the native export (a SwiftUI
view-modifier stack that chains the layers—see §7) and the OG share card
(`scripts/build-og.py`, the real layer recipe rendered at print scale).

**Deferred to v2:** scroll-linked or cursor-linked light previews; per-level
manual overrides of individual layer values.

**Out of scope entirely:** drop-shadow filters for irregular shapes; elevation
_animation_ tokens (that is Motion's domain—the markdown's rule about never
animating between distant levels is guidance, not tokens); anything with a
backend, an account, or a stored file.

## 3. The model

A **level** is 2–3 layered box-shadows, all cast by one light:

```
u        = distance x growth^(level-1)        the throw
key      = offset u, blur u x blurRatio, alpha opacity x falloff^(level-1)
ambient  = offset 0.35u, blur 2.2x the key's, alpha 0.65x the key's
contact  = offset 0.15u (capped 1px), blur 0.4u, alpha 1.4x key (capped 0.5)
```

Level 0 is `none`. Levels 1–5 grow geometrically—the scale reads as one
material photographed at different heights. The key layer is the directional
shadow the light casts; the ambient layer is the soft occlusion that keeps a
long throw from reading as a sticker; the contact layer (the third-layer
option) grounds a crisp scale at small sizes.

The light is one angle, standard math convention (90 = overhead), and shadows
fall opposite it: direction `(-cos a, sin a)` in screen coordinates. Angles
wrap rather than clamp—450 means 90.

**`pressed` is an inset, outside the scale.** It derives from the base unit,
not the growth curve: a well does not get deeper when a dropdown gets higher.

**Tint is the user's whole color decision.** One hex replaces black as the
shadow ink; the tool does not derive a "smart" tint from a brand color, because
that is Ramps' kind of judgment and duplicating it here badly would be worse
than not having it.

## 4. Presets

A preset is a bundle of the five curve numbers plus the layer count—declarative data, nothing branches on a preset id. Four ship: **Soft** (the
default: diffuse, quiet), **Crisp** (tight, pointable edges), **Dramatic**
(long throws, three layers), **Hairline** (barely-there, leans on edges).

Unlike Beeps there is no delta system: the parameter count is small enough that
the URL simply carries whichever values differ from the chosen preset, field by
field. Switching presets re-derives the curve; the light, tint, dark strategy
and token edits are the user's and survive the switch.

## 5. The semantic system

Eight tokens, authored as a declarative table in `src/lib/tokens.ts`:

| Token             | Level | Category |
| ----------------- | ----- | -------- |
| `shadow-none`     | 0     | SURFACE  |
| `shadow-raised`   | 1     | SURFACE  |
| `shadow-hover`    | 2     | SURFACE  |
| `shadow-sticky`   | 2     | OVERLAY  |
| `shadow-dropdown` | 3     | OVERLAY  |
| `shadow-modal`    | 4     | OVERLAY  |
| `shadow-toast`    | 5     | FEEDBACK |
| `shadow-pressed`  | inset | FEEDBACK |

Each carries a `when` and a `whenNot`—the Beeps insight that the _do-not_
column is what keeps a system from being misused, applied to elevation. Levels
are movable per link (`pu=modal5.hover3`); `none` and `pressed` are fixed by
meaning. Exclusions (`xt`) filter the **output, never the computation**—the resolver always produces the full set, the UI dims excluded rows, and
every exporter reads `exportedTokens()`.

Two tokens share level 2 (`hover`, `sticky`) deliberately: same height, two
different jobs. The names are the API; the numbers are an implementation
detail.

## 6. Dark mode

Two strategies, in the URL as `k`:

- **`s`—shadows only.** Alphas boosted x1.5, capped at 0.85.
- **`sb`—shadows + edges (default).** The boost, plus a hairline
  `--edge-<token>` border per token in BOTH modes—ink on light, white on
  dark, the same strength curve, strengthening slightly with level—so the
  toggle visibly does something whichever theme is being previewed, the same
  `border: var(--edge-raised)` works in either, and the theme flip never
  shifts layout. (Light edges were transparent originally; Ry made them
  two-mode on 2026-09-06.) The toggle renders in the scale section's header,
  but it is real state: the `k` param, shipped in every export.

The exports and the agent payload both state the limits: boosted or not,
elevation on a dark page is mostly carried by surface color, and the right
companion is a lightened surface ramp (Ramps), one step per elevation level.

## 7. Exports

Four tabs, all reading the same resolved values—the preview runs on the CSS
export's own variables, injected as a `<style>` block, so what you see is
byte-for-byte what you download.

- **CSS**—custom properties, light in `:root`, dark under `.dark`, edges in
  both.
- **Tailwind v4**—`@theme` pointing at intermediate variables that `.dark`
  redefines. Not decoration: Tailwind inlines `@theme` values into its
  generated utilities (verified against the compiler), so a plain dark
  override of the theme variable would be inert. The fidelity note states the
  cost—shadow-color utilities can't recolor an indirected value.
- **JSON (DTCG)**—the W3C composite `shadow` type for Style Dictionary-class
  pipelines. Dark values ride in `$extensions["studio.depths"]` because DTCG
  has no modes; `inset` is flagged with the note that some consumers ignore it.
  **There is deliberately no Figma tab**: Figma variables have no shadow type,
  so a Figma tab would be the quiet lie Motion refused to ship for easings.
- **Native (SwiftUI)**—an enum of the tokens and a colorScheme-aware
  `.depthsShadow(_:)` ViewModifier chaining the layers. Conversions are stated
  in the generated file's own header: blur → radius at ÷2, points = px at 1x.
  Spread would not survive (SwiftUI has none) and this scale never emits one—nothing lost rather than something hidden. The pressed inset uses
  `ShapeStyle.shadow(.inner)`, the one real inner shadow SwiftUI has, flooring
  that piece at iOS 16 / macOS 13.
- **Markdown**—the token table with when/when-not, the CSS, the rules, and
  the regenerate contract, written to be pasted into an agent's context.

## 8. Agent legibility

The family pattern, complete: `middleware.ts` routes `/` through `api/render`,
which injects the payload as both a JSON `<script>` and a visible `<pre>`
(HTML-to-markdown strips scripts; extractors honour inline hiding, so no
`display:none`—`main.tsx` removes the block once React proves it is
running). `/api/shadows` serves the same payload as JSON or plain text.
`llms.txt` is the contract; JSON-LD and `robots.txt` point at it.

The payload carries **`version: 1`** with Motion's stability contract: keys
are only ever added, and an unknown version is a reason to stop rather than
guess. Its `notes` object states everything correct-but-surprising: the dark
boost and its limits, the alpha units, why `pressed` ignores the growth curve.

## 9. URL state

Plain decimals, no scaling tables, no base64—an agent must be able to
hand-write a link from the table in `llms.txt`. Only differences from the
chosen preset are written, so a default link is bare. Every field decodes
defensively: clamped rather than rejected, dropped rather than erroring, and
`decodeWarnings` tells both the page and the payload what a damaged link lost—with rejected input quoted back only through an allowlist and a length cap,
because echoing a `pu` value unfiltered was a real XSS on Ramps.

## 10. Architecture

Scaffolded from Sound Studio, the family's cleanest layering. `api/render.ts`
is ported from Ramps' battle-tested copy—the SSO-page-at-200 guard, the
`jsonForScript` escaping, replacer functions everywhere. One resolve
(`src/lib/depths.ts`), one token resolver (`tokens.ts`), one CSS serialization
(`cssValue`), exporters in `export.ts`, the payload in `agent.ts`—all
Node-safe with `.js` imports so the functions share them. Components render;
`lib/` decides.

## 11. Decisions taken, and what is still open

Taken, with reasons above: derived-not-authored levels (§3); no Figma tab
(§7); Tailwind indirection (§7); dark honesty as the identity stance (§6);
`pressed` in v1 but outside the scale (§3); plain-decimal params (§9); the
`shape` → `depths` manifest rename (the last cheap moment).

Settled after launch (2026-09-06): the light dial magnet-snaps within 5° of
the eight compass points (Shift drags free; arrow keys still step 3°)—88°
and 90° are indistinguishable shadows, but 90 encodes to nothing and reads as
a decision; the OG card renders the real recipe on the Dramatic preset, the
one presets.ts itself describes as built for hero moments; the native export
is an enum plus a chained-shadow ViewModifier with the blur/2 conversion
stated in its own header (§7).

Still open, deliberately: whether a `spread` control earns its place. v1 keeps
spread at 0—every added parameter is another thing an agent must
understand, and the ambient layer already does the softening work spread
would. Revisit only if real use argues for it.
