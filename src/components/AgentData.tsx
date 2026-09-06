// ==============================================
// AGENT DATA
// The whole scale as markdown, at the bottom of the
// page, in the DOM whether or not anyone opens it.
//
// The family pattern: machine-readability is a
// visible design surface, not a hidden endpoint.
//
// It collapses for tidiness, NOT with display:none.
// Readability-style extractors honour inline hiding
// and skip such content, which would make this
// invisible to exactly the readers it exists for.
// A button plus a height-animated box that is ALWAYS
// mounted preserves the property a <details> had—
// the nodes stay in the document, they are merely
// not painted—while being able to animate.
// ==============================================
import { useState } from "react"
import { motion } from "motion/react"
import { CaretRight } from "@phosphor-icons/react"
import CopyText from "../shared/components/CopyText"
import { cn } from "../shared/utils"
import { DUR, EASE_PANEL } from "../shared/motion"
import { toAgentMarkdown } from "../lib/export"
import type { ResolvedScale } from "../lib/depths"

export default function AgentData({
  scale,
  url,
  warnings,
}: {
  scale: ResolvedScale
  url: string
  warnings: string[]
}) {
  // Collapsed by default: this block is for agents, and a wall of markdown
  // above the footer is not what a person came for.
  const [open, setOpen] = useState(false)
  const markdown = toAgentMarkdown(scale, url, warnings)

  return (
    <div className="border-line mt-12 rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="agent-scale"
        className="text-ash hover:text-ink flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left font-mono text-[11px] tracking-[0.16em] uppercase transition-colors"
      >
        <CaretRight
          size={11}
          weight="bold"
          aria-hidden="true"
          className={cn("shrink-0 transition-transform", open && "rotate-90")}
        />
        Machine-readable scale (for agents)
      </button>

      {/*
        Always mounted, height-animated—never unmounted. main.tsx removes the
        block api/render injects the moment React takes over, so once the app
        is running THIS is the only copy of the machine-readable text in the
        document. An {open && ...} here would delete it outright for anything
        that runs JavaScript and then reads the DOM.
      */}
      <motion.div
        id="agent-scale"
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: DUR.panel, ease: EASE_PANEL }}
        className="overflow-hidden"
        aria-hidden={!open}
      >
        <div className="px-4 pb-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-ash max-w-[70ch] text-sm leading-relaxed">
              The same markdown the Export panel emits—every token with its values, which
              surface gets which, and what dark mode actually needs. Fetching this page&rsquo;s
              URL returns the same data with no JavaScript required.
            </p>
            <CopyText
              value={markdown}
              title="Copy the markdown"
              swapOnCopy
              className="border-line hover:bg-ink/[0.04] shrink-0 rounded border px-2.5 py-1 font-mono text-[11px] transition-colors"
            >
              copy
            </CopyText>
          </div>
          <pre className="border-line bg-ink/[0.02] max-h-[50vh] overflow-auto rounded-md border p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
            {markdown}
          </pre>
        </div>
      </motion.div>
    </div>
  )
}
