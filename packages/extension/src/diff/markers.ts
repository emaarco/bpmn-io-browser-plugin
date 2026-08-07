/**
 * Apply the four bpmn-js-differ style markers to a pair of viewers.
 * Added/changed/moved are shown on the new (right) viewer, removed/changed/moved
 * on the old (left) viewer. Ported from the "BPMN Diff" userscript.
 */

import type { BpmnDiff } from '@git-diagram-viewer/core'

export const MARKER = {
  added: 'git-diagram-di-added',
  removed: 'git-diagram-di-removed',
  changed: 'git-diagram-di-changed',
  moved: 'git-diagram-di-moved',
  active: 'git-diagram-di-active',
} as const

type Viewer = any

function mark(viewer: Viewer | null, ids: string[], cls: string): void {
  if (!viewer) return
  const canvas = viewer.get('canvas')
  const registry = viewer.get('elementRegistry')
  for (const id of ids) {
    if (registry.get(id)) canvas.addMarker(id, cls)
  }
}

export function applyMarkers(
  oldViewer: Viewer | null,
  newViewer: Viewer | null,
  diff: BpmnDiff,
): void {
  mark(newViewer, diff.added, MARKER.added)
  mark(newViewer, diff.changed, MARKER.changed)
  mark(newViewer, diff.moved, MARKER.moved)

  mark(oldViewer, diff.removed, MARKER.removed)
  mark(oldViewer, diff.changed, MARKER.changed)
  mark(oldViewer, diff.moved, MARKER.moved)
}

/** Union of all changed element ids, in a stable order for navigation. */
export function changedIds(diff: BpmnDiff): string[] {
  return [...new Set([...diff.added, ...diff.removed, ...diff.changed, ...diff.moved])]
}
