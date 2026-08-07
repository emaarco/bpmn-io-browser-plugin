/**
 * Pure diff domain types. No bpmn-js, no DOM — everything here is derived from a
 * parsed BPMN model so it can be unit-tested in plain Node.
 */

/** A moddle business object. Loosely typed — the moddle API is dynamic. */
export type ModdleElement = {
  $type: string
  id?: string
  [key: string]: any
}

export interface Point {
  x: number
  y: number
}

/**
 * One diagram element as it appears on the canvas: its semantic business object
 * plus the layout taken from the matching BPMN DI shape/edge. This mirrors what a
 * bpmn-js `elementRegistry` entry exposes (`businessObject` + `x/y/width/height`),
 * but is built straight from moddle without a live viewer.
 */
export interface DiffElement {
  id: string
  businessObject: ModdleElement
  isConnection: boolean
  x?: number
  y?: number
  width?: number
  height?: number
  waypoints?: Point[]
}

/** All diagram elements of a model, indexed by their (semantic) id. */
export type ParsedModel = Map<string, DiffElement>

/**
 * Diff result in the four categories bpmn-js-differ uses:
 * added / removed (existence), changed (semantic property change), moved (layout only).
 */
export interface BpmnDiff {
  added: string[]
  removed: string[]
  changed: string[]
  moved: string[]
}

/** True when the diff contains no differences at all. */
export function isEmptyDiff(diff: BpmnDiff): boolean {
  return (
    diff.added.length === 0 &&
    diff.removed.length === 0 &&
    diff.changed.length === 0 &&
    diff.moved.length === 0
  )
}
