/**
 * Compute a four-category BPMN diff between two parsed models.
 *
 * Ported from the "BPMN Diff" userscript (v2.5): an element present in both models
 * is `changed` when its semantic signature differs, else `moved` when only its
 * layout differs; otherwise it is `added` (only in new) or `removed` (only in old).
 */

import type { BpmnDiff, DiffElement, ParsedModel } from './model'
import { signature } from './signature'

function semanticChanged(a: DiffElement, b: DiffElement): boolean {
  return signature(a.businessObject) !== signature(b.businessObject)
}

function waypointSignature(points: DiffElement['waypoints']): string {
  if (!points) return ''
  return JSON.stringify(points.map((p) => [p.x, p.y]))
}

function layoutChanged(a: DiffElement, b: DiffElement): boolean {
  if (a.x !== b.x || a.y !== b.y || a.width !== b.width || a.height !== b.height) {
    return true
  }
  return waypointSignature(a.waypoints) !== waypointSignature(b.waypoints)
}

export function computeDiff(oldModel: ParsedModel, newModel: ParsedModel): BpmnDiff {
  const added: string[] = []
  const removed: string[] = []
  const changed: string[] = []
  const moved: string[] = []

  newModel.forEach((el, id) => {
    const old = oldModel.get(id)
    if (!old) {
      added.push(id)
    } else if (semanticChanged(old, el)) {
      changed.push(id)
    } else if (layoutChanged(old, el)) {
      moved.push(id)
    }
  })

  oldModel.forEach((_el, id) => {
    if (!newModel.has(id)) removed.push(id)
  })

  return { added, removed, changed, moved }
}
