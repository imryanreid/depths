// ==============================================
// APP
// The page. Owns the config, keeps it in the URL,
// hands the layout to ToolShell.
//
// The config is the only state: everything visible is
// a pure function of it, resolved once and passed
// down. The resolved values are injected as CSS
// variables in a <style> block, and every preview
// surface reads those variables—the same values
// every export emits—so the preview cannot drift
// from the file you download.
// ==============================================
import { useCallback, useEffect, useMemo, useState } from "react"
import { DownloadSimple } from "@phosphor-icons/react"
import ToolShell from "./shared/components/ToolShell"
import ThemeToggle from "./shared/components/ThemeToggle"
import IconButton from "./shared/components/IconButton"
import ResetButton from "./shared/components/ResetButton"
import ShareButton from "./shared/components/ShareButton"
import ExportModal from "./shared/components/ExportModal"
import Segmented from "./shared/components/Segmented"
import { FieldLabel } from "./shared/components/Label"
import { useTheme } from "./shared/theme"
import Picker from "./components/Picker"
import Slider from "./components/Slider"
import LightSource from "./components/LightSource"
import LevelRamp from "./components/LevelRamp"
import TokenTable from "./components/TokenTable"
import Scenarios from "./components/Scenarios"
import AgentData from "./components/AgentData"
import DepthsExport from "./components/ExportPanel"
import {
  DEFAULT_CONFIG,
  cssValue,
  edgeValue,
  resolve,
  type DepthsConfig,
  type ResolvedScale,
} from "./lib/depths"
import { PRESETS, PRESET_IDS, type PresetId } from "./lib/presets"
import { resolveTokens, type ResolvedToken, type TokenId } from "./lib/tokens"
import { decodeWarnings, encodeConfig, resolveConfig } from "./lib/params"

/** Which entry in the shared tools manifest this repo is. */
const TOOL_ID = "depths"

export default function App() {
  const { theme, toggle } = useTheme()

  // The URL is the only persistence. Read once at mount; written back on every
  // change. Not read continuously—that would fight the user's own edits.
  const [config, setConfig] = useState<DepthsConfig>(() =>
    typeof window === "undefined" ? DEFAULT_CONFIG : resolveConfig(window.location.search),
  )
  const [warnings] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : decodeWarnings(window.location.search),
  )
  /** What Reset threw away, so its undo has something to put back. */
  const [previous, setPrevious] = useState<DepthsConfig | null>(null)
  const [exporting, setExporting] = useState(false)

  const scale = useMemo(() => resolve(config), [config])
  const tokens = useMemo(() => resolveTokens(scale), [scale])

  // Keep the address bar in step, without adding a history entry per change.
  useEffect(() => {
    if (typeof window === "undefined") return
    const query = encodeConfig(config)
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname
    window.history.replaceState(null, "", url)
  }, [config])

  const preset = PRESETS[config.presetId]
  const edited = (Object.keys(preset.params) as (keyof typeof preset.params)[]).some(
    (k) => config[k] !== preset.params[k],
  )

  // Switching preset re-derives the whole curve; the light, the tint, the dark
  // strategy and the token edits are yours, not the preset's, so they stay.
  const setPreset = useCallback((presetId: PresetId) => {
    setConfig((c) => ({ ...c, presetId, ...PRESETS[presetId].params }))
  }, [])

  const patch = useCallback((p: Partial<DepthsConfig>) => {
    setConfig((c) => ({ ...c, ...p }))
  }, [])

  const setTokenLevel = useCallback((id: TokenId, level: number) => {
    setConfig((c) => ({ ...c, overrides: { ...c.overrides, [id]: level } }))
  }, [])

  const toggleToken = useCallback((id: TokenId) => {
    setConfig((c) => ({
      ...c,
      excluded: c.excluded.includes(id)
        ? c.excluded.filter((x) => x !== id)
        : [...c.excluded, id],
    }))
  }, [])

  const shareUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}${window.location.pathname}${
          encodeConfig(config) ? `?${encodeConfig(config)}` : ""
        }`

  return (
    <ToolShell
      toolId={TOOL_ID}
      title="Elevation & Shadow Generator"
      subtitle="A six-level shadow scale from one light source, mapped to the surfaces that need it—layered, honest about dark mode, and readable by your agent."
      actions={
        <>
          <ThemeToggle theme={theme} onToggle={toggle} />
          <ResetButton
            onReset={() => {
              setPrevious(config)
              setConfig(DEFAULT_CONFIG)
            }}
            onUndo={() => previous && setConfig(previous)}
          />
          <ShareButton url={shareUrl} />
          <IconButton title="Export tokens" variant="solid" onClick={() => setExporting(true)}>
            <DownloadSimple size={17} weight="regular" />
          </IconButton>
        </>
      }
      controls={
        <div className="space-y-6">
          {/* Preset on its own row: the "edited" note can come and go without
              anything else on the line to shove around. */}
          <div>
            <FieldLabel
              aside={
                edited ? (
                  <span className="text-ash font-mono text-[10px]">edited</span>
                ) : undefined
              }
            >
              Preset
            </FieldLabel>
            <Picker
              value={config.presetId}
              options={PRESET_IDS.map((id) => ({ id, label: PRESETS[id].name }))}
              onChange={setPreset}
              ariaLabel="Shadow preset"
              triggerClassName="border-line hover:bg-ink/[0.04] h-9 rounded-md border px-3 font-mono text-[13px] transition-colors"
            />
          </div>

          {/* Everything that shapes the scale, one row, labels on a shared
              baseline at the top—the dial is taller than the sliders, so
              top-aligned is what keeps the row reading as one band. */}
          <div className="flex flex-wrap items-start gap-x-8 gap-y-6">
            <LightSource angle={config.angle} onChange={(angle) => patch({ angle })} />

            <Slider
              label="Distance"
              value={config.distance}
              min={0.25}
              max={8}
              step={0.25}
              unit="px"
              onChange={(distance) => patch({ distance })}
            />
            <Slider
              label="Growth"
              value={config.growth}
              min={1.1}
              max={3}
              step={0.05}
              unit="x"
              onChange={(growth) => patch({ growth })}
            />
            <Slider
              label="Blur"
              value={config.blur}
              min={0.5}
              max={6}
              step={0.1}
              unit="x"
              onChange={(blur) => patch({ blur })}
            />
            <Slider
              label="Opacity"
              value={config.opacity}
              min={1}
              max={40}
              step={1}
              unit="%"
              onChange={(opacity) => patch({ opacity })}
            />
            <Slider
              label="Falloff"
              value={config.falloff}
              min={0.6}
              max={1.2}
              step={0.01}
              unit="x"
              onChange={(falloff) => patch({ falloff })}
            />

            <div>
              <FieldLabel>Layers</FieldLabel>
              <Segmented
                options={[
                  { id: "2", label: "2", title: "Key + ambient" },
                  { id: "3", label: "3", title: "Adds a contact shadow" },
                ]}
                value={String(config.layers)}
                onChange={(v) => patch({ layers: Number(v) as 2 | 3 })}
                layoutId="layers-pill"
                ariaLabel="Layers per level"
              />
            </div>

            <TintField value={config.tint} onChange={(tint) => patch({ tint })} />
          </div>
        </div>
      }
      overlay={
        exporting ? (
          <ExportModal onClose={() => setExporting(false)}>
            <DepthsExport scale={scale} url={shareUrl} warnings={warnings} />
          </ExportModal>
        ) : null
      }
    >
      {/* The resolved values as CSS variables. Every preview below reads these;
          they are built from the same strings the exports emit. */}
      <style>{previewStyle(scale, tokens)}</style>

      {warnings.length > 0 && <Warnings items={warnings} />}

      {/* The edges toggle lives with the output rather than in the control
          band—Ry's call: it reads as a refinement of the scale you're looking
          at. It still ships in the URL (k) and in every export. */}
      <LevelRamp
        scale={scale}
        edges={config.dark === "sb"}
        onEdgesChange={(on) => patch({ dark: on ? "sb" : "s" })}
      />
      <TokenTable tokens={tokens} onLevelChange={setTokenLevel} onToggle={toggleToken} />
      <Scenarios />

      {/* Always in the DOM, like every tool in the family. See AgentData. */}
      <AgentData scale={scale} url={shareUrl} warnings={warnings} />
    </ToolShell>
  )
}

/**
 * The preview variable block. Levels get --depths-level-N (the raw scale, for
 * the ramp), tokens get the same --shadow-* / --edge-* names the CSS export
 * uses. Edges are two-mode—ink on light, white on dark—and collapse to
 * transparent when the toggle is off, so the previews honestly show what
 * turning them off costs.
 */
function previewStyle(scale: ResolvedScale, tokens: ResolvedToken[]): string {
  const edges = scale.config.dark === "sb"
  const NONE = "1px solid transparent"
  const light: string[] = []
  const dark: string[] = []
  for (const lv of scale.levels) {
    light.push(`  --depths-level-${lv.level}: ${cssValue(lv.layers, scale.tint, "light")};`)
    dark.push(`  --depths-level-${lv.level}: ${cssValue(lv.layers, scale.tint, "dark")};`)
    light.push(`  --depths-edge-${lv.level}: ${edges ? edgeValue(lv.level, "light") : NONE};`)
    dark.push(`  --depths-edge-${lv.level}: ${edges ? edgeValue(lv.level, "dark") : NONE};`)
  }
  light.push(`  --shadow-pressed-raw: ${cssValue(scale.pressed, scale.tint, "light")};`)
  dark.push(`  --shadow-pressed-raw: ${cssValue(scale.pressed, scale.tint, "dark")};`)
  for (const t of tokens) {
    light.push(`  --shadow-${t.id}: ${t.lightCss};`)
    dark.push(`  --shadow-${t.id}: ${t.darkCss};`)
    if (t.effectiveLevel !== 0) {
      light.push(`  --edge-${t.id}: ${edges ? t.edgeLight : NONE};`)
      dark.push(`  --edge-${t.id}: ${edges ? t.edgeDark : NONE};`)
    }
  }
  return `:root {\n${light.join("\n")}\n}\n.dark {\n${dark.join("\n")}\n}`
}

/**
 * The shadow ink. Empty means black; six hex digits mean a tinted shadow.
 * Commits on blur or Enter, like the color fields in Ramps.
 */
function TintField({
  value,
  onChange,
}: {
  value: string | null
  onChange: (tint: string | null) => void
}) {
  const [draft, setDraft] = useState(value ?? "")

  // Reflect external changes (reset, undo) without fighting typing.
  useEffect(() => setDraft(value ?? ""), [value])

  const commit = () => {
    const clean = draft.trim().replace(/^#/, "").toLowerCase()
    if (clean === "") onChange(null)
    else if (/^[0-9a-f]{6}$/.test(clean)) onChange(clean)
    else setDraft(value ?? "")
  }

  return (
    <div>
      <FieldLabel>Tint</FieldLabel>
      <div className="flex items-center gap-2">
        {/* The swatch IS the picker: a native color input, restyled by the
            .depths-swatch block in index.css. It commits continuously while
            the OS picker is open, which is the live-preview behaviour the
            sliders already have. */}
        <input
          type="color"
          value={`#${value ?? "000000"}`}
          aria-label="Pick the shadow tint"
          onChange={(e) => onChange(e.target.value.replace(/^#/, "").toLowerCase())}
          className="depths-swatch border-line h-9 w-9 shrink-0 cursor-pointer rounded-md border"
        />
        <input
          type="text"
          value={draft}
          placeholder="000000"
          spellCheck={false}
          aria-label="Shadow tint, six hex digits"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="border-line focus:border-ink/40 h-9 w-24 rounded-md border bg-transparent px-2.5 font-mono text-[13px] transition-colors focus:outline-none"
        />
      </div>
    </div>
  )
}

/**
 * What a mangled link lost. Shown rather than swallowed: a link that decoded
 * to *something* renders a completely coherent scale, and without this there
 * is no way to tell it is not the scale that was shared.
 */
function Warnings({ items }: { items: string[] }) {
  return (
    <div className="border-line bg-ink/[0.03] mb-8 rounded-lg border p-4">
      <p className="mb-2 font-mono text-[11px] tracking-[0.16em] uppercase">
        This link did not arrive intact
      </p>
      <ul className="text-ash space-y-1 text-sm leading-relaxed">
        {items.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
    </div>
  )
}
