// ==============================================
// LEVEL RAMP
// The elevation levels as floating cards—the raw
// scale before any semantics. Each card wears its
// level's shadow via the preview variables App
// injects, so light and dark both come free, and a
// click copies the CSS value.
//
// Extreme settings can throw a shadow hundreds of
// pixels. Two containment layers handle that:
// a uniform preview zoom—every card scaled by the
// SAME factor, so the levels stay comparable and the
// ramp never lies about their relationship—engaged
// only past a spill budget and stated in the header
// ("preview at 0.2x"); and a clipped stage around
// the grid, because the zoom is computed from an
// estimate of blur reach (a Gaussian has no hard
// edge) and the clip guarantees what the estimate
// can't. The numbers under the cards are always the
// TRUE pixel values—the zoom is a viewing condition,
// never a change to the scale.
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
import { cssValue, shadowReach } from "../lib/depths"

/** Card height, and how much spill past it is tolerated before zooming out.
 *  The tolerance sits just above the worst stock reach (Dramatic's level 5,
 *  ~118px)—the zoom must never engage on an untouched preset, and a test in
 *  depths.test.ts holds that line if preset numbers ever change. */
const CARD_H = 80
const SPILL_TOLERANCE = 128

export default function LevelRamp({
  scale,
  edges,
  onEdgesChange,
}: {
  scale: ResolvedScale
  edges: boolean
  onEdgesChange: (on: boolean) => void
}) {
  // The worst reach on any side of any level decides the zoom, continuously,
  // downward from 1 only.
  const reach = Math.max(
    ...scale.levels.slice(1).map((lv) => {
      const r = shadowReach(lv.layers)
      return Math.max(r.top, r.right, r.bottom, r.left)
    }),
  )
  const zoom = Math.min(
    1,
    Math.round(((CARD_H + SPILL_TOLERANCE) / (CARD_H + reach)) * 100) / 100,
  )

  return (
    <section className="mb-12">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <Label as="h2">The scale</Label>
          {/* Appears only when the zoom engages—a note that appears sometimes
              means something every time it does. */}
          {zoom < 1 && (
            <span className="text-ash font-mono text-[10px]">preview at {zoom}x</span>
          )}
        </div>
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
      {/* The stage: negative margins repaid as padding, so the clip boundary
          sits well outside the visual layout and normal shadows (and the 2px
          hover lift) render untouched—only a runaway spill meets it. */}
      <div className="-mx-8 -mt-12 overflow-hidden px-8 pt-12 pb-1">
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
                        ...(zoom < 1
                          ? { transform: `scale(${zoom})`, transformOrigin: "top center" }
                          : {}),
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
      </div>
    </section>
  )
}
