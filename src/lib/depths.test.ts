// ==============================================
// SHADOW MODEL TESTS
// The math: light direction, the growth and falloff
// progressions, dark boosting, and the CSS
// serialization every consumer reads.
// ==============================================
import { describe, expect, it } from "vitest"
import {
  DARK,
  DEFAULT_CONFIG,
  cssValue,
  darkAlpha,
  edgeValue,
  parseTint,
  resolve,
  shadowDirection,
} from "./depths.js"

describe("shadowDirection", () => {
  it("drops shadows straight down when the light is overhead", () => {
    expect(shadowDirection(90)).toEqual({ x: 0, y: 1 })
  })
  it("throws shadows down-left when the light is upper-right", () => {
    const d = shadowDirection(45)
    expect(d.x).toBeCloseTo(-0.707, 2)
    expect(d.y).toBeCloseTo(0.707, 2)
  })
  it("throws shadows down-right when the light is upper-left", () => {
    const d = shadowDirection(135)
    expect(d.x).toBeCloseTo(0.707, 2)
    expect(d.y).toBeCloseTo(0.707, 2)
  })
})

describe("resolve", () => {
  it("produces six levels, level 0 empty", () => {
    const scale = resolve(DEFAULT_CONFIG)
    expect(scale.levels).toHaveLength(6)
    expect(scale.levels[0].layers).toEqual([])
    for (let i = 1; i <= 5; i++) expect(scale.levels[i].layers.length).toBeGreaterThan(0)
  })

  it("grows the key offset geometrically", () => {
    const scale = resolve({ ...DEFAULT_CONFIG, angle: 90, distance: 1, growth: 2 })
    const key = (n: number) => scale.levels[n].layers.find((l) => l.role === "key")!
    expect(key(1).y).toBe(1)
    expect(key(2).y).toBe(2)
    expect(key(3).y).toBe(4)
    expect(key(4).y).toBe(8)
    // Everything falls the same way: x stays 0 under an overhead light.
    expect(key(4).x).toBe(0)
  })

  it("fades alpha by the falloff per level", () => {
    const scale = resolve({ ...DEFAULT_CONFIG, opacity: 10, falloff: 0.9 })
    const key = (n: number) => scale.levels[n].layers.find((l) => l.role === "key")!
    expect(key(1).alpha).toBeCloseTo(0.1, 3)
    expect(key(2).alpha).toBeCloseTo(0.09, 3)
    expect(key(3).alpha).toBeCloseTo(0.081, 3)
  })

  it("adds a contact layer only at three layers", () => {
    const two = resolve({ ...DEFAULT_CONFIG, layers: 2 })
    const three = resolve({ ...DEFAULT_CONFIG, layers: 3 })
    expect(two.levels[1].layers.map((l) => l.role)).toEqual(["key", "ambient"])
    expect(three.levels[1].layers.map((l) => l.role)).toEqual(["contact", "key", "ambient"])
  })

  it("clamps out-of-range inputs rather than rejecting them", () => {
    const scale = resolve({ ...DEFAULT_CONFIG, distance: 999, opacity: -5 })
    expect(scale.config.distance).toBe(8)
    expect(scale.config.opacity).toBe(1)
  })

  it("keeps the pressed inset on the base unit, not the growth curve", () => {
    const near = resolve({ ...DEFAULT_CONFIG, growth: 1.1 })
    const far = resolve({ ...DEFAULT_CONFIG, growth: 3 })
    expect(near.pressed).toEqual(far.pressed)
    expect(near.pressed[0].inset).toBe(true)
  })
})

describe("darkAlpha", () => {
  it("boosts by the stated factor", () => {
    expect(darkAlpha(0.1)).toBeCloseTo(0.1 * DARK.alphaBoost, 3)
  })
  it("caps at the stated ceiling", () => {
    expect(darkAlpha(0.8)).toBe(DARK.alphaCap)
  })
})

describe("cssValue", () => {
  const black = { r: 0, g: 0, b: 0 }

  it("serializes a layer as modern rgb syntax", () => {
    const css = cssValue(
      [{ x: 0, y: 1, blur: 2.6, spread: 0, alpha: 0.07, role: "key" }],
      black,
      "light",
    )
    expect(css).toBe("0px 1px 2.6px rgb(0 0 0 / 7%)")
  })

  it("boosts alpha in dark mode", () => {
    const css = cssValue(
      [{ x: 0, y: 1, blur: 2, spread: 0, alpha: 0.1, role: "key" }],
      black,
      "dark",
    )
    expect(css).toContain("15%")
  })

  it("prefixes inset and carries the tint", () => {
    const css = cssValue(
      [{ x: 0, y: 1, blur: 2, spread: 0, alpha: 0.1, role: "key", inset: true }],
      { r: 30, g: 42, b: 74 },
      "light",
    )
    expect(css).toBe("inset 0px 1px 2px rgb(30 42 74 / 10%)")
  })

  it("returns none for no layers", () => {
    expect(cssValue([], black, "light")).toBe("none")
  })
})

describe("edgeValue", () => {
  it("is ink on light and white on dark, same strength curve", () => {
    expect(edgeValue(3, "light")).toBe("1px solid rgb(0 0 0 / 10.5%)")
    expect(edgeValue(3, "dark")).toBe("1px solid rgb(255 255 255 / 10.5%)")
  })
  it("strengthens with level in dark", () => {
    expect(edgeValue(1, "dark")).toContain("7.5%")
    expect(edgeValue(5, "dark")).toContain("13.5%")
  })
})

describe("parseTint", () => {
  it("parses six hex digits", () => {
    expect(parseTint("1e2a4a")).toEqual({ r: 30, g: 42, b: 74 })
  })
  it("rejects anything else", () => {
    expect(parseTint("#1e2a4a")).toBeNull()
    expect(parseTint("fff")).toBeNull()
    expect(parseTint(null)).toBeNull()
  })
})
