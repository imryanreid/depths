// ==============================================
// TOKEN TABLE
// The semantic mapping: which token sits on which
// level, with the level movable per token and each
// row excludable from export.
//
// Exclusions dim a row rather than removing it—the
// scale is always fully resolved, and the checkbox
// filters the OUTPUT. Same rule as Ramps.
// ==============================================
import CopyButton from "../shared/components/CopyButton"
import RowToggle from "../shared/components/RowToggle"
import { Label } from "../shared/components/Label"
import Picker from "./Picker"
import { MOVABLE_TOKEN_IDS, type ResolvedToken, type TokenId } from "../lib/tokens"
import { cn } from "../shared/utils"

const LEVEL_OPTIONS = ["0", "1", "2", "3", "4", "5"].map((n) => ({ id: n, label: n }))

export default function TokenTable({
  tokens,
  onLevelChange,
  onToggle,
}: {
  tokens: ResolvedToken[]
  onLevelChange: (id: TokenId, level: number) => void
  onToggle: (id: TokenId) => void
}) {
  const categories = [...new Set(tokens.map((t) => t.category))]
  return (
    <section className="mb-12">
      <Label as="h2" className="mb-1.5 block">
        Semantic tokens
      </Label>
      <p className="text-ash mb-4 max-w-[62ch] text-sm leading-relaxed">
        The levels above, named for what they do. Move a token to another level if your product
        disagrees, and untick anything you don&rsquo;t want exported—the math never changes,
        only what ships.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="text-ash text-left font-mono text-[11px] tracking-[0.16em] uppercase">
              <th className="w-8 py-2 pr-4 font-normal" aria-label="Exported" />
              <th className="py-2 pr-4 font-normal">Token</th>
              <th className="py-2 pr-4 font-normal">Level</th>
              <th className="py-2 pr-4 font-normal">Use for</th>
              <th className="w-8 py-2 font-normal" aria-label="Copy" />
            </tr>
          </thead>
          {categories.map((category) => (
            <tbody key={category}>
              <tr>
                <td
                  colSpan={5}
                  className="text-ash pt-7 pb-1.5 font-mono text-[10px] tracking-[0.16em] uppercase"
                >
                  {category}
                </td>
              </tr>
              {tokens
                .filter((t) => t.category === category)
                .map((t) => {
                  const movable = (MOVABLE_TOKEN_IDS as readonly string[]).includes(t.id)
                  return (
                    <tr
                      key={t.id}
                      className={cn(
                        "border-line-soft group/cell border-t transition-opacity",
                        t.excluded && "opacity-40",
                      )}
                    >
                      <td className="py-2 pr-4">
                        <RowToggle
                          checked={!t.excluded}
                          onChange={() => onToggle(t.id)}
                          label={`Export ${t.token}`}
                        />
                      </td>
                      <td className="py-2 pr-4 font-mono text-[13px] whitespace-nowrap">
                        --{t.token}
                      </td>
                      <td className="py-2 pr-4">
                        {movable ? (
                          <Picker
                            value={String(t.effectiveLevel)}
                            options={LEVEL_OPTIONS}
                            onChange={(level) => onLevelChange(t.id, Number(level))}
                            ariaLabel={`Level for ${t.token}`}
                            triggerClassName="border-line hover:bg-ink/[0.04] rounded border px-2 py-0.5 font-mono text-[11px] transition-colors"
                          />
                        ) : (
                          <span
                            className="text-ash px-2 font-mono text-[11px]"
                            title={
                              t.effectiveLevel === "inset"
                                ? "Derived from the scale's base unit, not the growth curve—a well doesn't get deeper when a dropdown gets higher. Offset 0.75x distance toward the light, blur 1.5x distance + 1px, opacity 1.3x the base (capped at 50%), drawn inset."
                                : undefined
                            }
                          >
                            {t.effectiveLevel}
                          </span>
                        )}
                        {t.overridden && (
                          <span
                            className="text-ash ml-1.5 font-mono text-[10px]"
                            title="Moved off its authored level; travels in the URL as pu="
                          >
                            moved
                          </span>
                        )}
                      </td>
                      <td className="text-ash py-2 pr-4 leading-relaxed">{t.role}</td>
                      <td className="py-2">
                        <span className="opacity-0 transition-opacity group-hover/cell:opacity-100">
                          <CopyButton value={t.lightCss} title="Copy the box-shadow value" />
                        </span>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  )
}
