import type { DiagramDiff } from '../domain/model'

export function isEmptyDiff(diff: DiagramDiff): boolean {
  return (
    diff.added.length === 0 &&
    diff.removed.length === 0 &&
    diff.changed.length === 0 &&
    diff.moved.length === 0
  )
}
