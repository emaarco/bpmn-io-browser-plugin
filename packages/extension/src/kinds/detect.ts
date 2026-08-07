/**
 * Pure file-extension → diagram-kind detection. Kept free of any viewer imports
 * (bpmn-js / dmn-js touch `window` at import time) so it stays unit-testable in
 * plain Node and cheap to pull in anywhere. This is the single source of truth
 * for which extensions map to which kind.
 */

export type KindId = 'bpmn' | 'dmn'

const EXTENSION_TO_KIND: Readonly<Record<string, KindId>> = {
  bpmn: 'bpmn',
  dmn: 'dmn',
}

/** The diagram-kind id that renders this path, matched by file extension. */
export function detectKindId(pathname: string): KindId | null {
  const ext = /\.([^./]+)$/.exec(pathname)?.[1]?.toLowerCase()
  if (!ext) return null
  return EXTENSION_TO_KIND[ext] ?? null
}
