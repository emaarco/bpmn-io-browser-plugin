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

/**
 * The host page's effective theme — light or dark.
 *
 * We follow the *host page*, not the OS: reading `prefers-color-scheme` is wrong
 * when the page is light but the OS is dark (e.g. an anonymous, always-light
 * GitLab on a dark-mode machine — the diagram would render dark on a light page).
 * So we read the actual painted background behind our panel (walking up from
 * `context`, across the shadow boundary) and fall back to `body`/`html`; only
 * when nothing is painted do we consult the OS preference.
 */
export function detectHostTheme(context?: Element | null): Theme {
  const rgb =
    paintedBackgroundNear(context) ??
    readBackground(document.body) ??
    readBackground(document.documentElement)
  if (rgb) return luminance(rgb) < 0.5 ? 'dark' : 'light'
  if (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

/**
 * The first opaque background colour on the host page around `el`.
 *
 * Our panel lives in a shadow root and paints its own (light-by-default)
 * background, so we must start *outside* it: if `el` is inside a shadow root we
 * begin at the shadow host's parent — the host-page element our panel sits in —
 * and walk up from there. Returns null when every ancestor is transparent.
 */
function paintedBackgroundNear(el?: Element | null): [number, number, number] | null {
  let node = hostPageContext(el)
  while (node) {
    const rgb = readBackground(node)
    if (rgb) return rgb
    const parent = node.parentElement
    if (parent) {
      node = parent
      continue
    }
    const root = node.getRootNode()
    node = root instanceof ShadowRoot ? root.host : null
  }
  return null
}

/** The host-page element enclosing `el`, stepping out of our shadow root. */
function hostPageContext(el?: Element | null): Element | null {
  if (!el) return null
  const root = el.getRootNode()
  if (root instanceof ShadowRoot) return root.host.parentElement ?? root.host
  return el
}

export interface DiagramColors {
  stroke: string
  fill: string
}

/** Concrete diagram colours from inherited host tokens, with theme fallbacks. */
export function resolveDiagramColors(el: Element): DiagramColors {
  const dark = detectHostTheme(el) === 'dark'
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
