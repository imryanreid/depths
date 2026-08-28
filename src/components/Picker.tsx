// ==============================================
// PICKER
// One dropdown for the plain lists in this tool: the
// preset, and the per-token level override.
//
// Ported from Beeps' Picker: a custom listbox rather
// than a native <select>, so it matches the family's
// popovers instead of opening an OS menu in the app's
// own chrome. Dismissal is outside-click plus Escape,
// like every other popover in the family.
// ==============================================
import { useEffect, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CaretDown, Check } from "@phosphor-icons/react"
import { cn } from "../shared/utils"
import { POPOVER, POPOVER_ORIGIN } from "../shared/motion"

export type PickerOption<T extends string> = {
  id: T
  label: string
  /** Shown dimmed after the label. Never the only difference between options. */
  note?: string
}

export default function Picker<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  triggerClassName,
  trigger,
}: {
  value: T
  options: PickerOption<T>[]
  onChange: (id: T) => void
  ariaLabel: string
  /** Each call site keeps its own trigger chrome; this owns behaviour and the menu. */
  triggerClassName?: string
  /** Override the trigger's label. Defaults to the selected option's label. */
  trigger?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.id === value)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={cn("inline-flex items-center gap-1.5", triggerClassName)}
      >
        {trigger ?? current?.label ?? value}
        <CaretDown
          size={10}
          weight="bold"
          aria-hidden="true"
          className={cn("shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            {...POPOVER}
            className={cn(
              "border-line bg-paper absolute top-full left-0 z-30 mt-1.5 max-h-64 min-w-full overflow-y-auto rounded-md border shadow-xl",
              POPOVER_ORIGIN,
            )}
          >
            {options.map((o) => {
              const selected = o.id === value
              return (
                <button
                  key={o.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(o.id)
                    setOpen(false)
                  }}
                  className={cn(
                    "hover:bg-ink/[0.04] flex w-full items-center justify-between gap-3 px-2.5 py-1.5 text-left font-mono text-[11px] whitespace-nowrap transition-colors",
                    selected ? "text-ink" : "text-ash",
                  )}
                >
                  <span>
                    {o.label}
                    {o.note && <span className="opacity-50"> {o.note}</span>}
                  </span>
                  {selected && (
                    <Check size={11} weight="bold" aria-hidden="true" className="text-ink" />
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
