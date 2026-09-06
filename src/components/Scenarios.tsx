// ==============================================
// SCENARIOS
// The tokens previewed on the surfaces they're named
// for: a card that lifts, an open dropdown, a sticky
// bar, a modal, a toast, a pressed well. One
// vocabulary—the thing you are watching is named
// the same thing you'd reach for at a call site.
//
// Every mock reads the CSS variables App injects
// (the same values every export emits), so the
// preview cannot drift from the file you download.
// The dark tab of each scenario is the honesty demo:
// what shadows alone can and cannot do on a dark
// page, shown rather than told.
// ==============================================
import type { ReactNode } from "react"
import { Label } from "../shared/components/Label"

/** A mock surface: paper card, edge var where the token has one. */
function Surface({
  token,
  className = "",
  style = {},
  children,
}: {
  token: string
  className?: string
  style?: React.CSSProperties
  children?: ReactNode
}) {
  return (
    <div
      className={`bg-paper rounded-md ${className}`}
      style={{
        boxShadow: `var(--shadow-${token})`,
        border: `var(--edge-${token}, 1px solid transparent)`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Fake text lines, so surfaces read as content rather than empty boxes. */
function Lines({ n = 2, w = [70, 45] }: { n?: number; w?: number[] }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          className="bg-ink/10 h-1.5 rounded-full"
          style={{ width: `${w[i % w.length]}%` }}
        />
      ))}
    </div>
  )
}

function Cell({ label, children }: { label: string; children: ReactNode }) {
  // overflow-hidden: at extreme settings a mock's shadow can outgrow its cell;
  // the border makes the clip read as a frame, not a bug.
  return (
    <div className="border-line overflow-hidden rounded-lg border p-4">
      <p className="text-ash mb-3 font-mono text-[11px]">{label}</p>
      {children}
    </div>
  )
}

export default function Scenarios() {
  return (
    <section className="mb-12">
      <Label as="h2" className="mb-1.5 block">
        Preview
      </Label>
      <p className="text-ash mb-4 max-w-[62ch] text-sm leading-relaxed">
        Each surface runs on the exported variables—hover the card, and check dark mode:
        that&rsquo;s where the edges earn their keep.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Cell label="shadow-raised / shadow-hover">
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="bg-paper rounded-md p-3 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5"
                style={{
                  boxShadow: "var(--shadow-raised)",
                  border: "var(--edge-raised, 1px solid transparent)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-hover)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-raised)"
                }}
              >
                <div className="bg-ink/10 mb-2.5 h-8 rounded" />
                <Lines />
              </div>
            ))}
          </div>
        </Cell>

        <Cell label="shadow-dropdown">
          <div className="relative pb-16">
            <div className="border-line flex items-center justify-between rounded-md border px-3 py-1.5">
              <span className="text-ash font-mono text-[11px]">Sort by</span>
              <span className="text-ash text-[10px]">&#9662;</span>
            </div>
            <Surface token="dropdown" className="absolute top-9 left-0 z-10 w-40 p-1.5">
              {["Newest", "Oldest", "A to Z"].map((o, i) => (
                <div
                  key={o}
                  className={`rounded px-2 py-1 font-mono text-[11px] ${i === 0 ? "bg-ink/[0.06]" : "text-ash"}`}
                >
                  {o}
                </div>
              ))}
            </Surface>
          </div>
        </Cell>

        <Cell label="shadow-sticky">
          <div className="border-line relative h-28 overflow-hidden rounded-md border">
            <Surface
              token="sticky"
              className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 rounded-none px-3 py-2"
            >
              <div className="bg-ink/20 h-3 w-3 rounded-full" />
              <div className="bg-ink/10 h-1.5 w-16 rounded-full" />
            </Surface>
            <div className="space-y-2 p-3 pt-11">
              <Lines n={4} w={[85, 60, 75, 40]} />
            </div>
          </div>
        </Cell>

        <Cell label="shadow-modal">
          <div className="bg-ink/10 relative flex h-28 items-center justify-center overflow-hidden rounded-md">
            <Surface token="modal" className="w-3/4 p-3">
              <div className="bg-ink/15 mb-2 h-2 w-1/2 rounded-full" />
              <Lines />
              <div className="mt-2.5 flex justify-end gap-1.5">
                <div className="border-line h-4 w-10 rounded border" />
                <div className="bg-ink h-4 w-10 rounded" />
              </div>
            </Surface>
          </div>
        </Cell>

        <Cell label="shadow-toast">
          <div className="border-line relative h-28 overflow-hidden rounded-md border">
            <div className="space-y-2 p-3">
              <Lines n={3} w={[80, 55, 70]} />
            </div>
            <Surface
              token="toast"
              className="absolute right-2 bottom-2 flex items-center gap-2 px-3 py-2"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-[11px]">Saved</span>
            </Surface>
          </div>
        </Cell>

        <Cell label="shadow-pressed">
          <div className="flex h-28 items-center justify-center gap-4">
            <div
              className="bg-ink/[0.03] flex h-9 w-32 items-center rounded-full px-1"
              style={{ boxShadow: "var(--shadow-pressed)" }}
            >
              <div
                className="bg-paper h-7 w-7 rounded-full"
                style={{ boxShadow: "var(--shadow-raised)" }}
              />
            </div>
            <div
              className="flex h-9 items-center rounded-md px-3 font-mono text-[11px]"
              style={{ boxShadow: "var(--shadow-pressed)" }}
            >
              pressed
            </div>
          </div>
        </Cell>
      </div>
    </section>
  )
}
