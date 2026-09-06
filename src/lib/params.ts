// ==============================================
// URL PARAMS
// The query-string contract: encode the state that
// reproduces a scale, and decode it defensively.
//
// Once this ships these names are a public API—a
// shared link has to keep working—so changing one
// means changing README.md, public/llms.txt and the
// JSON-LD in index.html at the same time.
//
// Only differences travel. A field matching what the
// chosen preset supplies is not written, so a default
// link is bare and a tweaked one names its tweaks.
//
// No base64—the family rule. An agent can compute
// base64 fine, but it cannot diff it, explain it, or
// hand-write one from the parameter table in llms.txt.
//
// "." "-" "_" are the safe punctuation; "~" looks
// safe and is not (it returns as %7E). Deliberately
// free of browser and Vite globals so the Vercel
// Functions can import it.
// ==============================================
import { DEFAULT_ANGLE, DEFAULT_CONFIG, LIMITS, type DepthsConfig } from "./depths.js"
import { DEFAULT_PRESET, PRESETS, isPresetId } from "./presets.js"
import { MOVABLE_TOKEN_IDS, TOKENS, isTokenId } from "./tokens.js"

/**
 * Param → config field, for the five preset-owned numbers. Values travel as
 * plain decimals—`g=1.9`, not `g=190`—because "." is safe in a query
 * string and an agent hand-writing a link should not need a scaling table.
 */
const CURVE_FIELDS = [
  { key: "d", field: "distance" },
  { key: "g", field: "growth" },
  { key: "b", field: "blur" },
  { key: "o", field: "opacity" },
  { key: "f", field: "falloff" },
] as const

type CurveField = (typeof CURVE_FIELDS)[number]["field"]

const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v))

/** Serialize a config into a compact query string (no leading "?"). */
export function encodeConfig(config: DepthsConfig): string {
  const p = new URLSearchParams()
  if (config.presetId !== DEFAULT_PRESET) p.set("p", config.presetId)
  if (config.angle !== DEFAULT_ANGLE) p.set("a", String(Math.round(config.angle)))

  const preset = PRESETS[config.presetId].params
  for (const { key, field } of CURVE_FIELDS) {
    if (config[field] !== preset[field]) {
      p.set(key, String(Math.round(config[field] * 100) / 100))
    }
  }
  if (config.layers !== preset.layers) p.set("y", String(config.layers))
  if (config.tint) p.set("c", config.tint.toLowerCase())
  if (config.dark !== DEFAULT_CONFIG.dark) p.set("k", config.dark)

  // Token→level overrides: name then digit, dot-joined, in table order so the
  // same state always writes the same string.
  const moved = TOKENS.filter(
    (t) => typeof config.overrides[t.id] === "number" && config.overrides[t.id] !== t.level,
  )
  if (moved.length) {
    p.set("pu", moved.map((t) => `${t.id}${config.overrides[t.id]}`).join("."))
  }

  if (config.excluded.length) {
    // Sorted, so two configs with the same exclusions encode identically.
    p.set("xt", [...config.excluded].sort().join("."))
  }

  // URLSearchParams percent-encodes "." in values on some runtimes and not
  // others. It is safe unencoded in a query string per RFC 3986, and leaving
  // it readable is the point, so put it back.
  return p.toString().replace(/%2E/gi, ".")
}

/** Parse a query string into a partial config, dropping any invalid field. */
export function decodeConfig(search: string): Partial<DepthsConfig> {
  const p = new URLSearchParams(search)
  const out: Partial<DepthsConfig> = {}

  const preset = p.get("p")
  if (preset && isPresetId(preset)) out.presetId = preset

  const angle = Number(p.get("a"))
  if (p.has("a") && Number.isFinite(angle)) {
    // Angles wrap rather than clamp—450 means 90, and -30 means 330.
    out.angle = ((Math.round(angle) % 360) + 360) % 360
  }

  for (const { key, field } of CURVE_FIELDS) {
    const raw = Number(p.get(key))
    if (p.has(key) && Number.isFinite(raw)) {
      out[field as CurveField] = clamp(raw, LIMITS[field])
    }
  }

  const layers = p.get("y")
  if (layers === "2" || layers === "3") out.layers = Number(layers) as 2 | 3

  const tint = p.get("c")
  if (tint && /^[0-9a-fA-F]{6}$/.test(tint)) out.tint = tint.toLowerCase()

  const dark = p.get("k")
  if (dark === "s" || dark === "sb") out.dark = dark

  const pu = p.get("pu")
  if (pu) {
    const overrides: Partial<Record<string, number>> = {}
    for (const part of pu.split(".")) {
      const match = /^([a-z]+)([0-5])$/.exec(part)
      if (!match) continue
      const [, id, level] = match
      if (!(MOVABLE_TOKEN_IDS as readonly string[]).includes(id)) continue
      overrides[id] = Number(level)
    }
    if (Object.keys(overrides).length) out.overrides = overrides
  }

  const xt = p.get("xt")
  if (xt) {
    const excluded = xt.split(".").filter(isTokenId)
    if (excluded.length) out.excluded = [...new Set(excluded)]
  }

  return out
}

/** A complete config, filling anything the query string didn't supply. */
export function resolveConfig(search: string): DepthsConfig {
  const decoded = decodeConfig(search)
  const presetId = decoded.presetId ?? DEFAULT_PRESET
  const params = PRESETS[presetId].params
  return {
    presetId,
    angle: decoded.angle ?? DEFAULT_ANGLE,
    distance: decoded.distance ?? params.distance,
    growth: decoded.growth ?? params.growth,
    blur: decoded.blur ?? params.blur,
    opacity: decoded.opacity ?? params.opacity,
    falloff: decoded.falloff ?? params.falloff,
    layers: decoded.layers ?? params.layers,
    tint: decoded.tint ?? null,
    dark: decoded.dark ?? DEFAULT_CONFIG.dark,
    overrides: decoded.overrides ?? {},
    excluded: decoded.excluded ?? [],
  }
}

/** True while the visitor is looking at an untouched default. */
export function isDefaultConfig(config: DepthsConfig): boolean {
  return encodeConfig(config) === encodeConfig(DEFAULT_CONFIG)
}

const KNOWN_KEYS = new Set(["p", "a", "d", "g", "b", "o", "f", "y", "c", "k", "pu", "xt"])

/**
 * What this link lost on the way here.
 *
 * The decoder drops what it can't parse, which keeps every link renderable—
 * and used to be silent, which meant an agent could review a coherent scale
 * that is not the one that was shared. Rejected input is quoted back only
 * through an allowlist and a length cap; it is the least trustworthy thing in
 * the system, and this is the one place that repeats it.
 */
export function decodeWarnings(search: string): string[] {
  const p = new URLSearchParams(search)
  const out: string[] = []

  const preset = p.get("p")
  if (preset && !isPresetId(preset)) {
    out.push(
      `This link asks for a preset called "${preset.slice(0, 24)}", which does not exist. ` +
        `Showing ${DEFAULT_PRESET} instead, so what you are reading is not the scale that was shared.`,
    )
  }

  const pu = p.get("pu")
  if (pu) {
    const bad = pu
      .split(".")
      .filter((part) => !/^([a-z]+)([0-5])$/.test(part) || !isMovable(part))
    if (bad.length) {
      const named = bad.filter((k) => /^[A-Za-z0-9-]{1,20}$/.test(k)).slice(0, 4)
      const which = named.length ? ` (${named.join(", ")})` : ""
      out.push(
        `${bad.length} token assignment${bad.length === 1 ? "" : "s"} in this link ` +
          `could not be applied${which}. Those tokens are on their default levels.`,
      )
    }
  }

  const xt = p.get("xt")
  if (xt) {
    const bad = xt.split(".").filter((id) => !isTokenId(id))
    if (bad.length) {
      const named = bad.filter((k) => /^[A-Za-z0-9-]{1,20}$/.test(k)).slice(0, 4)
      const which = named.length ? ` (${named.join(", ")})` : ""
      out.push(
        `${bad.length} exclusion${bad.length === 1 ? "" : "s"} in this link ` +
          `${bad.length === 1 ? "names a token" : "name tokens"} not in the set${which}.`,
      )
    }
  }

  const unknown = [...p.keys()].filter((k) => !KNOWN_KEYS.has(k))
  if (unknown.length) {
    const named = unknown.filter((k) => /^[A-Za-z0-9_-]{1,20}$/.test(k)).slice(0, 4)
    const which = named.length ? ` (${named.join(", ")})` : ""
    out.push(
      `${unknown.length} parameter${unknown.length === 1 ? "" : "s"} in this link ` +
        `${unknown.length === 1 ? "is" : "are"} not part of the contract${which}. ` +
        `Either the link is stale, or it was rewritten in transit.`,
    )
  }

  return out
}

function isMovable(part: string): boolean {
  const match = /^([a-z]+)[0-5]$/.exec(part)
  return match !== null && (MOVABLE_TOKEN_IDS as readonly string[]).includes(match[1])
}
