// ==============================================
// SLIDER
// A labelled range input with a mono readout — the
// control for the five curve numbers.
//
// A native <input type="range">, restyled by the
// .depths-slider block in index.css. Native because
// the interaction (drag, arrow keys, focus) is
// exactly what the platform already does well; only
// the chrome is ours.
// ==============================================
import { FieldLabel } from "../shared/components/Label"

export default function Slider({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  /** Rendered after the number: "px", "%", "x". */
  unit?: string
  onChange: (value: number) => void
}) {
  return (
    <div className="w-36">
      <FieldLabel
        aside={
          <span className="text-ash font-mono text-[11px]">
            {value}
            {unit}
          </span>
        }
      >
        {label}
      </FieldLabel>
      <input
        type="range"
        className="depths-slider w-full"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
