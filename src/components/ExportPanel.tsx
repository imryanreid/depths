// ==============================================
// EXPORT PANEL
// This tool's formats, handed to the family's shared
// panel. The chrome, the code-vs-prompt fork and the
// dark terminal are all inherited; only the tabs and
// what they emit belong here.
//
// No Figma tab, deliberately: Figma variables have no
// shadow type, so a Figma tab would be the quiet lie
// Motion refused to ship for easings. The JSON tab is
// DTCG—the format Figma-adjacent pipelines (Style
// Dictionary and friends) actually consume.
// ==============================================
import ExportPanel, { type ExportFormat } from "../shared/components/ExportPanel"
import {
  agentPrompt,
  toAgentMarkdown,
  toCss,
  toDtcg,
  toNative,
  toTailwind,
} from "../lib/export"
import type { ResolvedScale } from "../lib/depths"

export default function DepthsExport({
  scale,
  url,
  warnings,
}: {
  scale: ResolvedScale
  url: string
  warnings: string[]
}) {
  const formats: ExportFormat[] = [
    {
      id: "css",
      label: "CSS",
      filename: "shadows.css",
      mime: "text/css",
      render: () => toCss(scale),
      fidelity: {
        summary: "Light and dark in one file",
        detail:
          "Custom properties in :root, boosted alphas under .dark, and—when the dark strategy includes edges—transparent-in-light hairline borders, so applying border: var(--edge-raised) unconditionally never shifts layout.",
      },
    },
    {
      id: "tailwind",
      label: "Tailwind",
      filename: "shadows-theme.css",
      mime: "text/css",
      render: () => toTailwind(scale),
      fidelity: {
        summary: "Theme values are indirected on purpose",
        detail:
          "Tailwind v4 inlines @theme values into the generated utilities, so a plain .dark override of the theme variable would change nothing—verified against the compiler, not assumed. The theme points at intermediate variables that .dark redefines, which is what lets shadow-raised follow the theme at runtime. The cost: Tailwind's shadow-color utilities can't recolor an indirected value, so tint the shadow here instead.",
      },
    },
    {
      id: "dtcg",
      label: "JSON",
      filename: "shadows.tokens.json",
      mime: "application/json",
      render: () => toDtcg(scale, url),
      fidelity: {
        summary: "DTCG—dark values ride in $extensions",
        detail:
          'W3C DTCG\'s composite shadow type, for Style Dictionary and similar pipelines. DTCG has no notion of modes, so dark values travel under $extensions["studio.depths"], and the inset flag on shadow-pressed is a recent addition some consumers ignore. There is no Figma tab because Figma variables have no shadow type—importing this file there has nothing to attach to.',
      },
    },
    {
      id: "native",
      label: "Native",
      filename: "DepthsShadows.swift",
      mime: "text/plain",
      render: () => toNative(scale, url),
      fidelity: {
        summary: "Radius is blur ÷ 2—the conversion is stated, not hidden",
        detail:
          "SwiftUI's shadow radius is roughly the Gaussian sigma, so CSS blur converts at half; points equal px at 1x. Chained .shadow() calls compose, so the layers survive intact, and this scale never emits spread—the one thing SwiftUI couldn't represent. The pressed inset uses ShapeStyle.shadow(.inner), which floors that one piece at iOS 16 / macOS 13.",
      },
    },
    {
      id: "markdown",
      label: "Markdown",
      filename: "shadows.md",
      mime: "text/markdown",
      render: () => toAgentMarkdown(scale, url, warnings),
      fidelity: {
        summary: "Carries intent, not just values",
        detail:
          "Which token goes on which surface and which never gets one, the one-step-per-interaction rule, and what dark mode actually needs. Written to be pasted into an agent's context.",
      },
    },
  ]

  return (
    <ExportPanel
      formats={formats}
      agentPrompt={agentPrompt(url)}
      codeBlurb="CSS variables, a Tailwind v4 theme, or DTCG design tokens—light and dark both. Copy or download."
    />
  )
}
