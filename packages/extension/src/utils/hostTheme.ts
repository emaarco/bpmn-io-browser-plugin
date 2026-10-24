export type Theme = 'light' | 'dark'

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

const PRIMER_AND_GITLAB_STROKE_TOKENS = [
  '--fgColor-default',
  '--color-fg-default',
  '--gl-text-color',
]
const PRIMER_AND_GITLAB_FILL_TOKENS = [
  '--bgColor-default',
  '--color-canvas-default',
  '--gl-background-color',
]

export function resolveDiagramColors(el: Element): DiagramColors {
  const dark = detectHostTheme(el) === 'dark'
  return {
    stroke: readCssVar(el, PRIMER_AND_GITLAB_STROKE_TOKENS, dark ? '#e6edf3' : '#1f2328'),
    fill: readCssVar(el, PRIMER_AND_GITLAB_FILL_TOKENS, dark ? '#0d1117' : '#ffffff'),
  }
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
