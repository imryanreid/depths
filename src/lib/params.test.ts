// ==============================================
// URL PARAMS TESTS
// The public contract: round-trips, default
// omission, defensive decoding, and the warnings a
// damaged link produces.
// ==============================================
import { describe, expect, it } from "vitest"
import { DEFAULT_CONFIG } from "./depths.js"
import { decodeWarnings, encodeConfig, isDefaultConfig, resolveConfig } from "./params.js"

describe("encodeConfig", () => {
  it("writes nothing for the default state", () => {
    expect(encodeConfig(DEFAULT_CONFIG)).toBe("")
  })

  it("writes only what differs from the chosen preset", () => {
    expect(
      encodeConfig({
        ...DEFAULT_CONFIG,
        presetId: "crisp",
        distance: 1,
        growth: 1.85,
        blur: 1.3,
        opacity: 12,
        falloff: 0.9,
        layers: 2,
      }),
    ).toBe("p=crisp")
  })

  it("writes curve values as plain decimals", () => {
    const q = encodeConfig({ ...DEFAULT_CONFIG, growth: 2.15, opacity: 12 })
    expect(q).toContain("g=2.15")
    expect(q).toContain("o=12")
  })

  it("keeps dots readable in pu and xt", () => {
    const q = encodeConfig({
      ...DEFAULT_CONFIG,
      overrides: { modal: 5, hover: 3 },
      excluded: ["toast", "pressed"],
    })
    expect(q).toContain("pu=hover3.modal5")
    expect(q).toContain("xt=pressed.toast")
    expect(q).not.toContain("%2E")
  })
})

describe("round-trips", () => {
  it("state → query → state is identity", () => {
    const config = {
      ...DEFAULT_CONFIG,
      presetId: "dramatic" as const,
      distance: 2,
      growth: 2.15,
      blur: 2.2,
      opacity: 18,
      falloff: 0.85,
      layers: 3 as const,
      angle: 120,
      tint: "1e2a4a",
      dark: "s" as const,
      overrides: { modal: 5 },
      excluded: ["pressed" as const],
    }
    const decoded = resolveConfig(`?${encodeConfig(config)}`)
    expect(decoded).toEqual(config)
  })

  it("a bare query resolves to the default", () => {
    expect(resolveConfig("")).toEqual(DEFAULT_CONFIG)
    expect(isDefaultConfig(resolveConfig(""))).toBe(true)
  })
})

describe("defensive decoding", () => {
  it("drops an unknown preset and keeps the rest", () => {
    const config = resolveConfig("?p=nonsense&o=20")
    expect(config.presetId).toBe("soft")
    expect(config.opacity).toBe(20)
  })

  it("clamps out-of-range curve values", () => {
    const config = resolveConfig("?d=999&f=0")
    expect(config.distance).toBe(8)
    expect(config.falloff).toBe(0.6)
  })

  it("wraps angles rather than clamping", () => {
    expect(resolveConfig("?a=450").angle).toBe(90)
    expect(resolveConfig("?a=-30").angle).toBe(330)
  })

  it("drops malformed pu parts and unknown xt names", () => {
    const config = resolveConfig("?pu=modal5.bogus9.none3&xt=toast.nope")
    expect(config.overrides).toEqual({ modal: 5 })
    expect(config.excluded).toEqual(["toast"])
  })

  it("rejects a malformed tint", () => {
    expect(resolveConfig("?c=zzz").tint).toBeNull()
    expect(resolveConfig("?c=1E2A4A").tint).toBe("1e2a4a")
  })
})

describe("decodeWarnings", () => {
  it("is silent for a clean link", () => {
    expect(decodeWarnings("?p=crisp&a=120")).toEqual([])
  })

  it("names an unknown preset", () => {
    const warnings = decodeWarnings("?p=nonsense")
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain("nonsense")
  })

  it("flags unapplied token assignments and foreign parameters", () => {
    const warnings = decodeWarnings("?pu=bogus9&zz=1")
    expect(warnings.some((w) => w.includes("token assignment"))).toBe(true)
    expect(warnings.some((w) => w.includes("not part of the contract"))).toBe(true)
  })

  it("never quotes back something that fails the allowlist", () => {
    const hostile = "?pu=" + encodeURIComponent("<script>alert(1)</script>9")
    for (const w of decodeWarnings(hostile)) {
      expect(w).not.toContain("<script>")
    }
  })
})
