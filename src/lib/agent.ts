// ==============================================
// THE AGENT PAYLOAD
// One serialization of a resolved scale for
// machines, in both shapes: JSON and plain text.
//
// Both /api/shadows and /api/render read this. That
// is the point—the family rule is that there is
// never a second serialization, and an endpoint that
// drifts from the page is exactly the way this tool
// would end up lying to somebody.
//
// The `version` key and its stability contract are
// Motion's pattern: keys are only ever added, and a
// consumer that sees a version it does not know
// should stop rather than guess. Documented in
// llms.txt.
// ==============================================
import { darkAlpha, resolve, shadowDirection, cssValue } from "./depths.js"
import { decodeWarnings, resolveConfig } from "./params.js"
import { PRESETS, PRESET_IDS } from "./presets.js"
import { resolveTokens } from "./tokens.js"

/** The origin this request arrived on, honouring the proxy headers. */
export function publicOrigin(request: Request): string {
  const url = new URL(request.url)
  const host = request.headers.get("x-forwarded-host") ?? url.host
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "")
  return `${proto}://${host}`
}

/**
 * Stated rather than implied—prose for output that is correct but reads
 * like a bug. The family signature.
 */
const NOTES = {
  darkMode:
    "Dark values boost every alpha x1.5 (capped at 0.85), and the optional --edge-* hairlines flip from ink to white. Even boosted, elevation on a dark surface is mostly carried by surface color—pair these tokens with a lightened surface ramp (https://www.ramps.studio/) rather than inventing stronger shadows.",
  alphaUnits:
    "Layer alpha is 0-1 in this payload and a percentage inside the CSS strings; they are the same number.",
  pressed:
    "shadow-pressed is an inset and deliberately outside the elevation scale: it derives from the base unit, not the growth curve, because a well does not get deeper when a dropdown gets higher.",
} as const

export type AgentPayload = {
  json: Record<string, unknown>
  text: string
  /** True when the URL asked for a particular scale rather than the default. */
  specific: boolean
}

export function buildAgentPayload(search: string, origin: string): AgentPayload {
  const config = resolveConfig(search)
  const scale = resolve(config)
  const tokens = resolveTokens(scale)
  const warnings = decodeWarnings(search)
  const preset = PRESETS[config.presetId]
  const dir = shadowDirection(config.angle)
  const specific = search.replace(/^\?/, "").length > 0

  const excluded = tokens.filter((t) => t.excluded).map((t) => t.token)

  const levels = scale.levels.map((lv) => ({
    level: lv.level,
    css: cssValue(lv.layers, scale.tint, "light"),
    cssDark: cssValue(lv.layers, scale.tint, "dark"),
    layers: lv.layers.map((l) => ({
      role: l.role,
      x: l.x,
      y: l.y,
      blur: l.blur,
      spread: l.spread,
      alpha: l.alpha,
      alphaDark: darkAlpha(l.alpha),
    })),
  }))

  const json = {
    version: 1,
    $schema: `${origin}/llms.txt`,
    generator: "Depths—www.depths.studio",
    source: `${origin}/${search}`,
    ...(warnings.length ? { warnings } : {}),
    preset: config.presetId,
    presetName: preset.name,
    light: {
      angle: config.angle,
      /** Unit vector shadows fall along, screen coordinates, y downward. */
      direction: dir,
    },
    curves: {
      distance: config.distance,
      growth: config.growth,
      blur: config.blur,
      opacity: config.opacity,
      falloff: config.falloff,
      layers: config.layers,
    },
    tint: config.tint ?? "000000",
    darkStrategy: config.dark,
    levels,
    tokens: tokens.map((t) => ({
      token: `--${t.token}`,
      /** The name `pu` and `xt` use in the URL. */
      key: t.id,
      level: t.effectiveLevel,
      ...(t.overridden ? { overridden: true } : {}),
      ...(t.excluded ? { excluded: true } : {}),
      role: t.role,
      category: t.category,
      css: t.lightCss,
      cssDark: t.darkCss,
      // Both edge values when edges are on. `edgeLight` arrived with the
      // two-mode edges (2026-09-06); keys are only ever added, so version
      // stays 1 and a consumer reading only edgeDark keeps working.
      ...(config.dark === "sb" && t.effectiveLevel !== 0
        ? { edgeLight: t.edgeLight, edgeDark: t.edgeDark }
        : {}),
      when: t.when,
      whenNot: t.whenNot,
    })),
    ...(excluded.length ? { excludedTokens: excluded } : {}),
    notes: NOTES,
    presets: PRESET_IDS.map((id) => ({
      id,
      name: PRESETS[id].name,
      blurb: PRESETS[id].blurb,
      suits: PRESETS[id].suits,
    })),
    docs: `${origin}/llms.txt`,
  }

  const lines: string[] = []
  lines.push("DEPTHS—www.depths.studio", "")
  lines.push(`preset  ${config.presetId} (${preset.name})`)
  lines.push(`light   ${config.angle} deg—shadows fall toward (${dir.x}, ${dir.y})`)
  lines.push(
    `curves  distance ${config.distance}px, growth x${config.growth}, blur x${config.blur}, opacity ${config.opacity}%, falloff x${config.falloff}, ${config.layers} layers`,
    "",
  )
  if (warnings.length) {
    lines.push("THIS LINK DID NOT ARRIVE INTACT", ...warnings.map((w) => `  ${w}`), "")
  }
  lines.push("LEVELS (light mode; dark boosts alpha x1.5, capped 0.85)")
  for (const lv of levels) {
    lines.push(`  ${lv.level}  ${lv.css}`)
  }
  lines.push("")
  lines.push("TOKENS")
  for (const t of tokens) {
    const flags = [t.overridden ? "moved" : "", t.excluded ? "EXCLUDED" : ""]
      .filter(Boolean)
      .join(", ")
    lines.push(`  --${t.token}  (level ${t.effectiveLevel}${flags ? `; ${flags}` : ""})`)
    lines.push(`    value     ${t.lightCss}`)
    lines.push(`    dark      ${t.darkCss}`)
    if (config.dark === "sb" && t.effectiveLevel !== 0) {
      lines.push(`    edge      ${t.edgeLight} (light) / ${t.edgeDark} (dark)`)
    }
    lines.push(`    use when  ${t.when}`)
    lines.push(`    not when  ${t.whenNot}`)
  }
  lines.push("")
  lines.push("NOTES")
  for (const note of Object.values(NOTES)) lines.push(`  ${note}`)
  lines.push("")
  lines.push("PRESETS")
  for (const id of PRESET_IDS) lines.push(`  ${id.padEnd(9)} ${PRESETS[id].blurb}`)
  lines.push("", "REGENERATE WITH DIFFERENT INPUTS")
  lines.push(`  ${origin}/?p=<preset>              one of: ${PRESET_IDS.join(", ")}`)
  lines.push(
    `  ${origin}/?a=<0-360>               light angle; 90 = overhead, 135 = upper-left`,
  )
  lines.push(
    `  ${origin}/?d=1.5&g=2&b=2.5&o=10    curve values as plain decimals; see llms.txt`,
  )
  lines.push(`  ${origin}/?y=<2|3>                 layers per level (3 adds a contact shadow)`)
  lines.push(`  ${origin}/?c=<6-digit hex>         tinted shadow ink, no #`)
  lines.push(`  ${origin}/?k=<s|sb>                dark strategy: shadows, or shadows + edges`)
  lines.push(`  ${origin}/?pu=modal5.hover3        move tokens to other levels`)
  lines.push(`  ${origin}/?xt=pressed.toast        exclude tokens from export`)
  lines.push(`  ${origin}/api/shadows              this data as JSON`)
  lines.push(`  ${origin}/api/shadows?format=text  this data as text`)
  lines.push("", `Full contract: ${origin}/llms.txt`)

  return { json, text: lines.join("\n"), specific }
}
