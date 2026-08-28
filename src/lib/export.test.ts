// ==============================================
// EXPORTER TESTS
// Exact-output assertions per format, plus the rules
// that keep exports honest: exclusions filter output,
// and every format reads the same resolved values.
// ==============================================
import { describe, expect, it } from "vitest"
import { DEFAULT_CONFIG, resolve } from "./depths.js"
import { toAgentMarkdown, toCss, toDtcg, toTailwind } from "./export.js"

const URL = "https://www.depths.studio/?p=crisp"

describe("toCss", () => {
  it("emits light in :root and boosted dark under .dark", () => {
    const css = toCss(resolve(DEFAULT_CONFIG))
    expect(css).toContain(":root {")
    expect(css).toContain(".dark {")
    expect(css).toContain("--shadow-raised:")
    expect(css).toContain("--shadow-none: none;")
    // Default: opacity 7% at level 1 in light; 10.5% boosted in dark.
    expect(css).toContain("rgb(0 0 0 / 7%)")
    expect(css).toContain("rgb(0 0 0 / 10.5%)")
  })

  it("ships edges when the dark strategy asks for them, transparent in light", () => {
    const withEdges = toCss(resolve({ ...DEFAULT_CONFIG, dark: "sb" }))
    expect(withEdges).toContain("--edge-raised: 1px solid transparent;")
    expect(withEdges).toContain("--edge-raised: 1px solid rgb(255 255 255 /")
    const without = toCss(resolve({ ...DEFAULT_CONFIG, dark: "s" }))
    expect(without).not.toContain("--edge-")
  })

  it("respects exclusions", () => {
    const css = toCss(resolve({ ...DEFAULT_CONFIG, excluded: ["toast"] }))
    expect(css).not.toContain("--shadow-toast")
    expect(css).toContain("--shadow-modal")
  })
})

describe("toTailwind", () => {
  it("indirects theme values through runtime variables", () => {
    const css = toTailwind(resolve(DEFAULT_CONFIG))
    expect(css).toContain("@theme {")
    expect(css).toContain("--shadow-raised: var(--depths-raised);")
    expect(css).toContain("--depths-raised:")
    expect(css).toContain(".dark {")
  })
})

describe("toDtcg", () => {
  it("emits valid JSON with the composite shadow type and hex8 colors", () => {
    const parsed = JSON.parse(toDtcg(resolve(DEFAULT_CONFIG), URL))
    const raised = parsed.shadow.raised
    expect(raised.$type).toBe("shadow")
    expect(Array.isArray(raised.$value)).toBe(true)
    // 7% of 255 is 18 → hex 12.
    expect(raised.$value[0].color).toBe("#00000012")
    expect(raised.$extensions["studio.depths"].dark).toBeDefined()
    expect(raised.$extensions["studio.depths"].level).toBe(1)
  })

  it("marks the pressed token inset", () => {
    const parsed = JSON.parse(toDtcg(resolve(DEFAULT_CONFIG), URL))
    expect(parsed.shadow.pressed.$value[0].inset).toBe(true)
  })

  it("carries the tint into the hex", () => {
    const parsed = JSON.parse(toDtcg(resolve({ ...DEFAULT_CONFIG, tint: "1e2a4a" }), URL))
    expect(parsed.shadow.raised.$value[0].color.startsWith("#1e2a4a")).toBe(true)
  })
})

describe("toAgentMarkdown", () => {
  it("carries the tokens, the CSS, the rules and the family", () => {
    const md = toAgentMarkdown(resolve(DEFAULT_CONFIG), URL)
    expect(md).toContain("| Token | Level |")
    expect(md).toContain("```css")
    expect(md).toContain("One step per interaction")
    expect(md).toContain("ramps.studio")
    expect(md).toContain("Other tools in this family")
  })

  it("surfaces link warnings", () => {
    const md = toAgentMarkdown(resolve(DEFAULT_CONFIG), URL, ["Something was lost."])
    expect(md).toContain("did not arrive intact")
    expect(md).toContain("Something was lost.")
  })
})
