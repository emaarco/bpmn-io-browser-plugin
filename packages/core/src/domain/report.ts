/**
 * Turn a raw {@link BpmnDiff} into a human-readable report: each changed element
 * enriched with its BPMN type and name. Framework-free, so it feeds both the
 * extension UI and a server-side PR/MR bot.
 */

import type { ParsedModel } from './model'
import { computeDiff } from './diff'

export type DiffKind = 'added' | 'removed' | 'changed' | 'moved'

export interface DiffEntry {
  id: string
  kind: DiffKind
  /** BPMN type without the namespace prefix, e.g. `ServiceTask`. */
  type: string
  /** The element's name, when it has one. */
  name?: string
}

export interface DiffReport {
  entries: DiffEntry[]
  counts: Record<DiffKind, number>
}

function describe(id: string, kind: DiffKind, model: ParsedModel): DiffEntry {
  const bo = model.get(id)?.businessObject
  const type = (bo?.$type ?? 'Unknown').replace(/^[^:]+:/, '')
  const name = typeof bo?.name === 'string' && bo.name.trim() ? bo.name.trim() : undefined
  return { id, kind, type, name }
}

export function describeDiff(oldModel: ParsedModel, newModel: ParsedModel): DiffReport {
  const diff = computeDiff(oldModel, newModel)
  const entries: DiffEntry[] = [
    ...diff.added.map((id) => describe(id, 'added', newModel)),
    ...diff.removed.map((id) => describe(id, 'removed', oldModel)),
    ...diff.changed.map((id) => describe(id, 'changed', newModel)),
    ...diff.moved.map((id) => describe(id, 'moved', newModel)),
  ]
  return {
    entries,
    counts: {
      added: diff.added.length,
      removed: diff.removed.length,
      changed: diff.changed.length,
      moved: diff.moved.length,
    },
  }
}
