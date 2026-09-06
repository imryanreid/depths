// ==============================================
// SEMANTIC TOKENS
// The declarative table mapping tokens to levels,
// and the resolver that turns it plus a config into
// the exported set.
//
// Same architecture as Ramps' semantics and Motion's
// purposes: one authored table, one resolver, every
// exporter and the agent payload reading only the
// resolved array. Exclusions filter the OUTPUT, never
// the computation—the UI needs excluded rows to
// render dimmed, and nothing downstream may see a
// half-computed set.
// ==============================================
import {
  cssValue,
  edgeValue,
  resolve,
  type DepthsConfig,
  type ResolvedScale,
  type ShadowLayer,
} from "./depths.js"

/** Short names—what `pu` and `xt` carry in the URL. The token is `shadow-<name>`. */
export const TOKEN_IDS = [
  "none",
  "raised",
  "hover",
  "sticky",
  "dropdown",
  "modal",
  "toast",
  "pressed",
] as const
export type TokenId = (typeof TOKEN_IDS)[number]

export type TokenCategory = "SURFACE" | "OVERLAY" | "FEEDBACK"

export type TokenDef = {
  id: TokenId
  /** The exported name: `shadow-raised`. */
  token: string
  role: string
  category: TokenCategory
  /** Authored level, 0–5—or "inset" for the one token outside the scale. */
  level: number | "inset"
  when: string
  whenNot: string
}

const t = (
  id: TokenId,
  role: string,
  category: TokenCategory,
  level: number | "inset",
  when: string,
  whenNot: string,
): TokenDef => ({ id, token: `shadow-${id}`, role, category, level, when, whenNot })

/**
 * The authored mapping. Levels can be moved per-link via `pu`; the table is
 * the default the family of exports and the page both start from.
 */
export const TOKENS: TokenDef[] = [
  t(
    "none",
    "Flush with the surface",
    "SURFACE",
    0,
    "Inputs, list rows, table cells—anything that belongs to the page rather than sitting on it.",
    "Don't use elevation to fix a contrast problem; that's a color decision.",
  ),
  t(
    "raised",
    "Cards and buttons at rest",
    "SURFACE",
    1,
    "The default for anything that reads as an object: cards, tiles, buttons.",
    "Not for nesting—a raised card inside a raised card flattens both.",
  ),
  t(
    "hover",
    "The lifted state of anything interactive",
    "SURFACE",
    2,
    "On hover or focus of an element that is shadow-raised at rest, so the lift reads as one step up.",
    "Not as a resting state—if everything is lifted, nothing is.",
  ),
  t(
    "sticky",
    "Sticky headers and toolbars",
    "OVERLAY",
    2,
    "Bars that pin over scrolling content, the moment content actually passes beneath them.",
    "Not while the page sits at the top—a shadow over nothing announces machinery.",
  ),
  t(
    "dropdown",
    "Menus, popovers, tooltips",
    "OVERLAY",
    3,
    "Transient surfaces summoned from a control and dismissed by a click elsewhere.",
    "Not for dialogs that take over the page—that is shadow-modal's job.",
  ),
  t(
    "modal",
    "Dialogs and sheets",
    "OVERLAY",
    4,
    "Surfaces that block the page behind a scrim and hold focus until dismissed.",
    "Not for toasts—a modal shadow on a toast makes a notification feel like an interruption.",
  ),
  t(
    "toast",
    "Toasts and floating notifications",
    "FEEDBACK",
    5,
    "The top of the stack: transient messages that float over everything, including modals.",
    "Never on persistent chrome. The top level is loud because nothing lives there.",
  ),
  t(
    "pressed",
    "Pressed wells and active insets",
    "FEEDBACK",
    "inset",
    "Wells, active toggle tracks, pressed button states—surfaces pushed below the page.",
    "Not for disabled states; depressed and disabled are different messages.",
  ),
]

/** Tokens whose level `pu` may move. `none` and `pressed` are fixed by meaning. */
export const MOVABLE_TOKEN_IDS = TOKENS.filter(
  (d) => d.id !== "none" && d.id !== "pressed",
).map((d) => d.id)

export function isTokenId(id: string): id is TokenId {
  return (TOKEN_IDS as readonly string[]).includes(id)
}

export type ResolvedToken = TokenDef & {
  /** The effective level after `pu` overrides. Unchanged for `pressed`. */
  effectiveLevel: number | "inset"
  /** True when the link moved this token off its authored level. */
  overridden: boolean
  excluded: boolean
  lightCss: string
  darkCss: string
  edgeLight: string
  edgeDark: string
  layers: ShadowLayer[]
}

/**
 * The full set, every token resolved whether excluded or not.
 * The UI renders from this; exports use exportedTokens() below.
 */
export function resolveTokens(scale: ResolvedScale): ResolvedToken[] {
  const { config, levels, pressed, tint } = scale
  return TOKENS.map((def) => {
    const override = def.level === "inset" ? undefined : config.overrides[def.id]
    const effectiveLevel =
      def.level === "inset"
        ? ("inset" as const)
        : typeof override === "number"
          ? Math.min(5, Math.max(0, Math.round(override)))
          : def.level
    const layers = effectiveLevel === "inset" ? pressed : (levels[effectiveLevel]?.layers ?? [])
    const edgeLevel = effectiveLevel === "inset" ? 1 : effectiveLevel
    return {
      ...def,
      effectiveLevel,
      overridden: typeof override === "number" && override !== def.level,
      excluded: config.excluded.includes(def.id),
      lightCss: cssValue(layers, tint, "light"),
      darkCss: cssValue(layers, tint, "dark"),
      edgeLight: edgeValue(edgeLevel, "light"),
      edgeDark: edgeValue(edgeLevel, "dark"),
      layers,
    }
  })
}

/** What actually ships. Every exporter reads THIS, never resolveTokens directly. */
export function exportedTokens(scale: ResolvedScale): ResolvedToken[] {
  return resolveTokens(scale).filter((tok) => !tok.excluded)
}

/** Convenience: config → resolved tokens, the one entry point app and functions share. */
export function tokensFromConfig(config: DepthsConfig): {
  scale: ResolvedScale
  tokens: ResolvedToken[]
} {
  const scale = resolve(config)
  return { scale, tokens: resolveTokens(scale) }
}
