/**
 * Align the injected UI with the host page's theme.
 *
 * The chrome (toolbar/buttons/borders) is themed purely in CSS by *inheriting*
 * the host's design tokens (Primer on GitHub, GitLab tokens) — CSS custom
 * properties cross the shadow-DOM boundary, so `var(--fgColor-default, …)` in
 * our styles resolves to the host's exact light/dark palette for free.
 *
 * The bpmn-js renderer, however, needs concrete colours up front. We read the
 * same inherited tokens off an in-tree element and fall back to per-theme
 * defaults (via background luminance) for hosts that don't expose them
 * (self-hosted / the standalone page).
 */

export type Theme = 'light' | 'dark'

export function detectHostTheme(): Theme {
  const rgb = readBackground(document.body) ?? readBackground(document.documentElement)
  if (rgb) return luminance(rgb) < 0.5 ? 'dark' : 'light'
  if (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export interface DiagramColors {
  stroke: string
  fill: string
}

/** Concrete diagram colours from inherited host tokens, with theme fallbacks. */
export function resolveDiagramColors(el: Element): DiagramColors {
  const dark = detectHostTheme() === 'dark'
  const stroke = readCssVar(
    el,
    ['--fgColor-default', '--color-fg-default', '--gl-text-color'],
    dark ? '#e6edf3' : '#1f2328',
  )
  const fill = readCssVar(
    el,
    ['--bgColor-default', '--color-canvas-default', '--gl-background-color'],
    dark ? '#0d1117' : '#ffffff',
  )
  return { stroke, fill }
}

function readCssVar(el: Element, names: string[], fallback: string): string {
  const style = getComputedStyle(el)
  for (const name of names) {
    const value = style.getPropertyValue(name).trim()
    if (value) return value
  }
  return fallback
}

function readBackground(el: Element | null): [number, number, number] | null {
  if (!el) return null
  const match = getComputedStyle(el).backgroundColor.match(/rgba?\(([^)]+)\)/)
  if (!match) return null
  const parts = match[1]!.split(',').map((s) => parseFloat(s))
  const [r, g, b, a = 1] = parts
  if (a === 0 || r === undefined || g === undefined || b === undefined) return null
  return [r, g, b]
}

function luminance([r, g, b]: [number, number, number]): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}
