// ==============================================
// PRESETS
// Named starting points for the scale. A preset is a
// bundle of curve parameters and nothing else —
// declarative data, like Beeps' characters. Nothing
// anywhere branches on a preset id.
//
// Unlike Beeps, edits are not deltas against the
// preset: the parameter count is small enough that
// the URL just carries whichever values differ from
// the chosen preset, field by field. See params.ts.
// ==============================================

export type PresetParams = {
  distance: number
  growth: number
  blur: number
  opacity: number
  falloff: number
  layers: 2 | 3
}

export type Preset = {
  name: string
  /** One line on what it feels like, shown in the picker and the agent payload. */
  blurb: string
  /** Where it belongs, for the agent payload's guidance. */
  suits: string
  params: PresetParams
}

export const PRESET_IDS = ["soft", "crisp", "dramatic", "hairline"] as const
export type PresetId = (typeof PRESET_IDS)[number]

export const DEFAULT_PRESET: PresetId = "soft"

export const PRESETS: Record<PresetId, Preset> = {
  soft: {
    name: "Soft",
    blurb: "Diffuse and quiet — elevation you feel more than see.",
    suits: "Product UI that wants depth without drama. The safe default.",
    params: { distance: 1, growth: 1.9, blur: 2.6, opacity: 7, falloff: 0.95, layers: 2 },
  },
  crisp: {
    name: "Crisp",
    blurb: "Tight and close to the surface — edges you can point at.",
    suits: "Dense interfaces and small components, where a diffuse shadow reads as blur.",
    params: { distance: 1, growth: 1.85, blur: 1.3, opacity: 12, falloff: 0.9, layers: 2 },
  },
  dramatic: {
    name: "Dramatic",
    blurb: "Long throws and real darkness — a stage, not an office.",
    suits: "Marketing surfaces and hero moments. Too loud for a settings page.",
    params: { distance: 2, growth: 2.15, blur: 2.2, opacity: 15, falloff: 0.85, layers: 3 },
  },
  hairline: {
    name: "Hairline",
    blurb: "Barely-there shadows that lean on edges — flat design that still stacks.",
    suits: "Interfaces that are mostly borders already; the shadow only breaks ties.",
    params: { distance: 0.5, growth: 1.7, blur: 1.6, opacity: 5, falloff: 1, layers: 2 },
  },
}

export function isPresetId(id: string): id is PresetId {
  return (PRESET_IDS as readonly string[]).includes(id)
}
