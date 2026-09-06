// ==============================================
// THE SHADOW MODEL
// One light source plus three curves, resolved into
// a six-level elevation scale of layered shadows.
//
// This is the whole tool: everything visible—the
// level ramp, the previews, every export, the agent
// payload—reads the ResolvedScale this module
// produces. No consumer recomputes an offset, and
// there is never a second serialization of a value.
//
// Deliberately free of browser and Vite globals so
// the Vercel Functions can import it.
// ==============================================
import { DEFAULT_PRESET, PRESETS, type PresetId } from "./presets.js"

/** One box-shadow layer, numbers only. Rendering to CSS happens in one place below. */
export type ShadowLayer = {
  x: number
  y: number
  blur: number
  spread: number
  /** 0–1. The only field dark mode changes. */
  alpha: number
  /**
   * What the layer is for. `key` is the tight, directional shadow the light
   * casts; `ambient` is the soft occlusion around the whole element; `contact`
   * is the dark line where it nearly touches the surface. Named so exports and
   * the agent payload can say which is which.
   */
  role: "key" | "ambient" | "contact"
  inset?: boolean
}

export type Level = {
  /** 0–5. Level 0 is flush—no layers. */
  level: number
  layers: ShadowLayer[]
}

/** How dark values differ from light. One rule, stated once. */
export const DARK = {
  /** Shadows need more ink on a dark surface to read at all. */
  alphaBoost: 1.5,
  /** Boosted alpha never exceeds this—beyond it a shadow reads as a hole. */
  alphaCap: 0.85,
} as const

export const LEVEL_COUNT = 6 // 0–5

/** The user-editable state. Everything on the page is a pure function of this. */
export type DepthsConfig = {
  presetId: PresetId
  /**
   * Where the light sits, in degrees, standard math convention: 90 is directly
   * overhead (shadows fall straight down), 45 is upper-right (shadows fall
   * down-left), 135 is upper-left (shadows fall down-right).
   */
  angle: number
  /** Key-shadow offset in px at level 1. The scale's base unit. */
  distance: number
  /** Per-level multiplier on the offset. 1.9 means each level throws ~2x further. */
  growth: number
  /** Blur as a multiple of the offset. Low is crisp, high is diffuse. */
  blur: number
  /** Key-layer opacity at level 1, percent. */
  opacity: number
  /** Per-level multiplier on opacity. Below 1, higher shadows are more transparent. */
  falloff: number
  /** 2 = key + ambient. 3 adds a contact layer where the element meets the surface. */
  layers: 2 | 3
  /** Shadow color as 6-digit hex without "#", or null for black. */
  tint: string | null
  /** Dark-mode strategy: shadows alone, or shadows plus hairline edges. */
  dark: "s" | "sb"
  /** Semantic tokens moved off their authored level, token short-name → level. */
  overrides: Partial<Record<string, number>>
  /** Token short-names excluded from export. Filters output, never computation. */
  excluded: string[]
}

/** Clamp ranges. Out-of-range input is clamped rather than rejected—a link
 *  always resolves to a renderable scale. */
export const LIMITS = {
  angle: [0, 360],
  distance: [0.25, 8],
  growth: [1.1, 3],
  blur: [0.5, 6],
  opacity: [1, 40],
  falloff: [0.6, 1.2],
} as const satisfies Record<string, readonly [number, number]>

export const DEFAULT_ANGLE = 90

export const DEFAULT_CONFIG: DepthsConfig = {
  presetId: DEFAULT_PRESET,
  angle: DEFAULT_ANGLE,
  ...PRESETS[DEFAULT_PRESET].params,
  tint: null,
  dark: "sb",
  overrides: {},
  excluded: [],
}

export type Rgb = { r: number; g: number; b: number }

/** "3d7dff" → {r, g, b}. Returns null on anything that isn't 6 hex digits. */
export function parseTint(hex: string | null | undefined): Rgb | null {
  if (!hex || !/^[0-9a-fA-F]{6}$/.test(hex)) return null
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  }
}

export type ResolvedScale = {
  config: DepthsConfig
  /** The six levels, light-mode alphas. Dark is derived per-layer via darkAlpha(). */
  levels: Level[]
  /** The inset well—outside the elevation scale, derived from its base unit. */
  pressed: ShadowLayer[]
  /** The shadow ink. Black unless tinted. */
  tint: Rgb
}

// The `+ 0` folds IEEE negative zero back to plain zero—cos(90°) is a tiny
// negative number, and without it every overhead shadow gets an x of -0,
// which is equal to 0 everywhere except Object.is and a reader's eyebrows.
const round1 = (n: number) => Math.round(n * 10) / 10 + 0
const round3 = (n: number) => Math.round(n * 1000) / 1000 + 0

const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v))

/**
 * The direction shadows fall, as a unit vector in screen coordinates
 * (y grows downward). Opposite the light: light overhead (90) → (0, 1).
 */
export function shadowDirection(angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180
  return { x: round3(-Math.cos(rad)), y: round3(Math.sin(rad)) }
}

/** The dark-mode alpha for a light-mode layer. The one place the boost lives. */
export function darkAlpha(alpha: number): number {
  return round3(Math.min(alpha * DARK.alphaBoost, DARK.alphaCap))
}

/**
 * Resolve a config into the full scale.
 *
 * Layer recipe, per level i (1–5), with throw u = distance x growth^(i-1):
 *   key      offset u, blur u x blurRatio, alpha opacity x falloff^(i-1)
 *   ambient  offset 0.35u, blur 2.2x the key's, alpha 0.65x the key's
 *   contact  offset 0.15u (capped at 1px), blur 0.4u, alpha 1.4x key (capped 0.5)
 * The ambient layer is what keeps a long throw from reading as a sticker;
 * the contact layer is what grounds a crisp scale at small sizes.
 */
export function resolve(config: DepthsConfig): ResolvedScale {
  const angle = clamp(config.angle, LIMITS.angle)
  const distance = clamp(config.distance, LIMITS.distance)
  const growth = clamp(config.growth, LIMITS.growth)
  const blurRatio = clamp(config.blur, LIMITS.blur)
  const opacity = clamp(config.opacity, LIMITS.opacity)
  const falloff = clamp(config.falloff, LIMITS.falloff)

  const dir = shadowDirection(angle)
  const tint = parseTint(config.tint) ?? { r: 0, g: 0, b: 0 }

  const levels: Level[] = [{ level: 0, layers: [] }]
  for (let i = 1; i < LEVEL_COUNT; i++) {
    const u = distance * Math.pow(growth, i - 1)
    const keyAlpha = (opacity / 100) * Math.pow(falloff, i - 1)
    const layers: ShadowLayer[] = []

    if (config.layers === 3) {
      layers.push({
        x: round1(dir.x * Math.min(u * 0.15, 1)),
        y: round1(dir.y * Math.min(u * 0.15, 1)),
        blur: round1(Math.max(1, u * 0.4)),
        spread: 0,
        alpha: round3(Math.min(keyAlpha * 1.4, 0.5)),
        role: "contact",
      })
    }

    layers.push({
      x: round1(dir.x * u),
      y: round1(dir.y * u),
      blur: round1(u * blurRatio),
      spread: 0,
      alpha: round3(keyAlpha),
      role: "key",
    })

    layers.push({
      x: round1(dir.x * u * 0.35),
      y: round1(dir.y * u * 0.35),
      blur: round1(u * blurRatio * 2.2),
      spread: 0,
      alpha: round3(keyAlpha * 0.65),
      role: "ambient",
    })

    levels.push({ level: i, layers })
  }

  // The pressed well inverts the base unit. It is not "level -1": insets don't
  // scale with elevation, they scale with the surface they're cut into.
  const pressed: ShadowLayer[] = [
    {
      x: round1(dir.x * distance * 0.75),
      y: round1(dir.y * distance * 0.75),
      blur: round1(distance * 1.5 + 1),
      spread: 0,
      alpha: round3(Math.min((opacity / 100) * 1.3, 0.5)),
      role: "key",
      inset: true,
    },
  ]

  return {
    config: { ...config, angle, distance, growth, blur: blurRatio, opacity, falloff },
    levels,
    pressed,
    tint,
  }
}

const px = (n: number) => `${Number.isInteger(n) ? n : round1(n)}px`
const pct = (alpha: number) => {
  const p = Math.round(alpha * 1000) / 10
  return `${Number.isInteger(p) ? p : p.toFixed(1)}%`
}

/**
 * Layers → a CSS box-shadow value. THE serialization—every export, the
 * preview, and the agent payload call this, so the file you copy is the shadow
 * you saw.
 */
export function cssValue(layers: ShadowLayer[], tint: Rgb, mode: "light" | "dark"): string {
  if (layers.length === 0) return "none"
  return layers
    .map((l) => {
      const a = mode === "dark" ? darkAlpha(l.alpha) : l.alpha
      const parts = [
        l.inset ? "inset " : "",
        `${px(l.x)} ${px(l.y)} ${px(l.blur)}`,
        l.spread !== 0 ? ` ${px(l.spread)}` : "",
        ` rgb(${tint.r} ${tint.g} ${tint.b} / ${pct(a)})`,
      ]
      return parts.join("")
    })
    .join(", ")
}

/**
 * How far a set of layers visually reaches beyond its box, per side, in px.
 *
 * Blur is counted at half its radius: per spec the penumbra straddles the
 * shifted edge—half inside, half outside—so offset + blur/2 is where the
 * fade actually ends. Still an estimate of a soft gradient, which is why the
 * preview that uses this also clips its stage: the container guarantees what
 * an estimate can't. Insets reach inward and are ignored.
 */
export function shadowReach(layers: ShadowLayer[]): {
  top: number
  right: number
  bottom: number
  left: number
} {
  const out = { top: 0, right: 0, bottom: 0, left: 0 }
  for (const l of layers) {
    if (l.inset) continue
    const b = l.blur / 2
    out.right = Math.max(out.right, round1(l.x + b))
    out.left = Math.max(out.left, round1(-l.x + b))
    out.bottom = Math.max(out.bottom, round1(l.y + b))
    out.top = Math.max(out.top, round1(-l.y + b))
  }
  return out
}

/**
 * The hairline edge that carries elevation where shadows can't. Present in
 * BOTH modes—ink on light, white on dark, the same strength curve—so the
 * toggle visibly does something whichever theme you're previewing, and the
 * theme flip never shifts layout. (They were transparent in light originally;
 * Ry made them two-mode on 2026-09-06.) Dark is still where they carry the
 * load: a light-mode card usually has a shadow doing the work.
 */
export function edgeValue(level: number, mode: "light" | "dark"): string {
  const alpha = Math.min(0.06 + level * 0.015, 0.16)
  const channel = mode === "dark" ? 255 : 0
  return `1px solid rgb(${channel} ${channel} ${channel} / ${pct(alpha)})`
}
