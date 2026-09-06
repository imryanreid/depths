// ==============================================
// LIGHT SOURCE
// The signature control: a dial with a draggable
// light puck orbiting a small card. Dragging the puck
// re-aims every shadow on the page live, and the card
// in the middle wears the level-2 shadow so the
// effect is visible inside the control itself.
//
// Angle convention matches the model: standard math
// degrees, 90 = overhead, so the puck at the top
// means shadows fall straight down.
// ==============================================
import { useCallback, useEffect, useRef, useState } from "react"
import { FieldLabel } from "../shared/components/Label"
import { cn } from "../shared/utils"

const SIZE = 84
const RADIUS = SIZE / 2 - 7

/** Pointer position relative to the dial center → the light's azimuth. */
function angleFrom(cx: number, cy: number, px: number, py: number): number {
  // Screen y grows downward; the model's math convention has 90 at the top.
  const deg = (Math.atan2(cy - py, px - cx) * 180) / Math.PI
  return (Math.round(deg) + 360) % 360
}

export default function LightSource({
  angle,
  onChange,
}: {
  angle: number
  onChange: (angle: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const fromEvent = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return
      const raw = angleFrom(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        e.clientX,
        e.clientY,
      )
      // A magnet on the eight compass points: within 5°, the puck lands on the
      // point exactly. 88 and 90 are indistinguishable shadows, but 90 encodes
      // to nothing (it is the default) and reads as a decision rather than a
      // wobble. Shift drags free; the arrow keys still move in 3° steps for
      // anyone who wants the in-between on purpose.
      const snapped = Math.round(raw / 45) * 45
      onChange(!e.shiftKey && Math.abs(raw - snapped) <= 5 ? snapped % 360 : raw)
    },
    [onChange],
  )

  // Window-level listeners while dragging, so the puck follows the pointer
  // even once it leaves the dial—the standard slider feel.
  useEffect(() => {
    if (!dragging) return
    const move = (e: PointerEvent) => fromEvent(e)
    const up = () => setDragging(false)
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
  }, [dragging, fromEvent])

  const rad = (angle * Math.PI) / 180
  const puckX = SIZE / 2 + RADIUS * Math.cos(rad)
  const puckY = SIZE / 2 - RADIUS * Math.sin(rad)

  return (
    <div>
      <FieldLabel aside={<span className="text-ash font-mono text-[11px]">{angle}&deg;</span>}>
        Light
      </FieldLabel>
      <div
        ref={ref}
        role="slider"
        aria-label="Light angle"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={angle}
        aria-valuetext={`${angle} degrees`}
        tabIndex={0}
        onPointerDown={(e) => {
          e.preventDefault()
          setDragging(true)
          fromEvent(e)
        }}
        onKeyDown={(e) => {
          // Arrow keys walk the light around the dial; the visual direction of
          // "left/right" follows the top of the circle, where the puck usually is.
          if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault()
            onChange((angle + (e.shiftKey ? 15 : 3)) % 360)
          }
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault()
            onChange((angle - (e.shiftKey ? 15 : 3) + 360) % 360)
          }
        }}
        className={cn(
          "border-line relative cursor-pointer touch-none rounded-full border",
          "focus-visible:ring-ink/30 focus-visible:ring-2 focus-visible:outline-none",
          dragging && "border-ink/30",
        )}
        style={{ width: SIZE, height: SIZE }}
      >
        {/* The subject: a tiny card wearing the hover-level shadow, so the
            control shows its own consequence. */}
        <div
          className="bg-paper absolute rounded-[5px]"
          style={{
            width: 26,
            height: 26,
            left: SIZE / 2 - 13,
            top: SIZE / 2 - 13,
            boxShadow: "var(--shadow-hover)",
            border: "var(--edge-hover, 1px solid transparent)",
          }}
        />
        {/* The light. */}
        <div
          className="bg-ink absolute rounded-full"
          style={{ width: 10, height: 10, left: puckX - 5, top: puckY - 5 }}
        />
      </div>
    </div>
  )
}
