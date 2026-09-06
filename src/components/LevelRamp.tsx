// ==============================================
// LEVEL RAMP
// The elevation levels as floating cards—the raw
// scale before any semantics. Each card wears its
// level's shadow via the preview variables App
// injects, so light and dark both come free, and a
// click copies the CSS value.
//
// The edges toggle sits in this section's header:
// it reads as a refinement of the scale you're
// looking at, though it is real state—the k param,
// shipped in every export.
//
// The values listed under each card are the KEY
// layer's numbers—the directional shadow. The
// ambient and contact layers derive from it and are
// spelled out in the token table and every export.
// ==============================================
import CopyText from "../shared/components/CopyText"
import Segmented from "../shared/components/Segmented"
import { Label } from "../shared/components/Label"
import type { ResolvedScale } from "../lib/depths"
import { cssValue } from "../lib/depths"

export default function LevelRamp({
  scale,
  edges,
  onEdgesChange,
}: {
  scale: ResolvedScale
  edges: boolean
  onEdgesChange: (on: boolean) => void
}) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Label as="h2">The scale</Label>
        <div className="flex items-center gap-3">
          <Label>Edges</Label>
          <Segmented
            options={[
              { id: "off", label: "Off", title: "Shadows carry elevation alone" },
              {
                id: "on",
                label: "On",
                title: "Hairlines in both modes—ink on light, white on dark",
              },
            ]}
            value={edges ? "on" : "off"}
            onChange={(v) => onEdgesChange(v === "on")}
            layoutId="edges-pill"
            size="sm"
            ariaLabel="Hairline edges"
          />
        </div>
      </div>
      {/* Levels 1–5 only. Level 0 is "none", and a card demonstrating the
          absence of a shadow was spending a sixth of the row saying nothing. */}
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
        {scale.levels.slice(1).map((lv) => {
          const key = lv.layers.find((l) => l.role === "key")
          const value = cssValue(lv.layers, scale.tint, "light")
          return (
            <CopyText
              key={lv.level}
              value={value}
              title="Copy the box-shadow value"
              className="group block w-full text-left"
            >
              {(copied) => (
                <span className="block">
                  <span
                    className="bg-paper block h-20 rounded-lg transition-transform group-hover:-translate-y-0.5"
                    style={{
                      boxShadow: `var(--depths-level-${lv.level})`,
                      border: `var(--depths-edge-${lv.level})`,
                    }}
                  />
                  <span className="mt-2.5 flex items-baseline justify-between">
                    <span className="font-mono text-[13px]">{lv.level}</span>
                    <span className="text-ash font-mono text-[10px]">
                      {copied
                        ? "copied"
                        : key
                          ? `${key.y}px / ${key.blur}px / ${Math.round(key.alpha * 1000) / 10}%`
                          : "none"}
                    </span>
                  </span>
                </span>
              )}
            </CopyText>
          )
        })}
      </div>
    </section>
  )
}
