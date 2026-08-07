import { bpmnKind } from './bpmn'
import { dmnKind } from './dmn'
import { detectKindId } from './detect'
import type { DiagramKind } from './types'

/** All renderable diagram kinds, keyed by id. Add a kind here + in detect.ts. */
const KIND_BY_ID: Record<DiagramKind['id'], DiagramKind> = {
  bpmn: bpmnKind,
  dmn: dmnKind,
}

export const DIAGRAM_KINDS: readonly DiagramKind[] = Object.values(KIND_BY_ID)

/** The diagram kind that renders this path (viewer + CSS), or null. */
export function detectKind(pathname: string): DiagramKind | null {
  const id = detectKindId(pathname)
  return id ? KIND_BY_ID[id] : null
}
