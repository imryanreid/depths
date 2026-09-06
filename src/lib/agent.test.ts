// ==============================================
// AGENT PAYLOAD TESTS
// The machine contract: the version key, the source
// link, the notes, and the plain-text shape a
// no-JavaScript reader sees.
// ==============================================
import { describe, expect, it } from "vitest"
import { buildAgentPayload } from "./agent.js"

const ORIGIN = "https://www.depths.studio"

describe("buildAgentPayload", () => {
  it("carries the version and stability surface", () => {
    const { json } = buildAgentPayload("", ORIGIN)
    expect(json.version).toBe(1)
    expect(json.generator).toContain("Depths")
    expect(json.docs).toBe(`${ORIGIN}/llms.txt`)
  })

  it("marks the default scale as non-specific and a parameterized one as specific", () => {
    expect(buildAgentPayload("", ORIGIN).specific).toBe(false)
    expect(buildAgentPayload("?p=crisp", ORIGIN).specific).toBe(true)
  })

  it("resolves the query into the payload", () => {
    const { json } = buildAgentPayload("?p=dramatic&a=135", ORIGIN)
    expect(json.preset).toBe("dramatic")
    const light = json.light as { angle: number; direction: { x: number; y: number } }
    expect(light.angle).toBe(135)
    expect(light.direction.x).toBeCloseTo(0.707, 2)
  })

  it("absents warnings on a clean link and carries them on a damaged one", () => {
    expect(buildAgentPayload("?p=crisp", ORIGIN).json.warnings).toBeUndefined()
    const damaged = buildAgentPayload("?p=nonsense", ORIGIN)
    expect(Array.isArray(damaged.json.warnings)).toBe(true)
  })

  it("flags curve edits against the preset, absently when stock", () => {
    expect(buildAgentPayload("", ORIGIN).json.presetEdited).toBeUndefined()
    const edited = buildAgentPayload("?b=5.2&o=39", ORIGIN)
    expect(edited.json.presetEdited).toEqual(["blur", "opacity"])
    expect(edited.text).toContain("edited: blur, opacity")
  })

  it("gives no edge fields to pressed", () => {
    const { json } = buildAgentPayload("?y=3", ORIGIN)
    const tokens = json.tokens as { key: string; edgeLight?: string }[]
    expect(tokens.find((t) => t.key === "pressed")?.edgeLight).toBeUndefined()
    expect(tokens.find((t) => t.key === "raised")?.edgeLight).toBeDefined()
  })

  it("flags moved and excluded tokens", () => {
    const { json } = buildAgentPayload("?pu=modal5&xt=pressed", ORIGIN)
    const tokens = json.tokens as { key: string; overridden?: boolean; excluded?: boolean }[]
    expect(tokens.find((t) => t.key === "modal")?.overridden).toBe(true)
    expect(tokens.find((t) => t.key === "pressed")?.excluded).toBe(true)
    expect(json.excludedTokens).toEqual(["shadow-pressed"])
  })

  it("renders the text shape a no-JavaScript reader depends on", () => {
    const { text } = buildAgentPayload("?p=crisp", ORIGIN)
    expect(text).toContain("DEPTHS—www.depths.studio")
    expect(text).toContain("LEVELS")
    expect(text).toContain("TOKENS")
    expect(text).toContain("REGENERATE WITH DIFFERENT INPUTS")
    expect(text).toContain(`${ORIGIN}/api/shadows`)
    expect(text).toContain("llms.txt")
  })

  it("states the dark-mode reality in the notes", () => {
    const { json } = buildAgentPayload("", ORIGIN)
    const notes = json.notes as Record<string, string>
    expect(notes.darkMode).toContain("surface color")
    expect(notes.darkMode).toContain("ramps.studio")
  })
})
