/**
 * Public entry point for `@git-diagram-viewer/core`: framework-free BPMN parsing and the
 * four-category semantic diff. No bpmn-js, no DOM — safe to run in Node or a
 * browser-extension background worker alike.
 */

// Domain — pure diff over parsed models
export { computeDiff } from './domain/diff'
export { describeDiff } from './domain/report'
export type { DiffReport, DiffEntry, DiffKind } from './domain/report'
export { signature } from './domain/signature'
export { isEmptyDiff } from './domain/model'
export type { BpmnDiff, DiffElement, ParsedModel, ModdleElement, Point } from './domain/model'

// Adapter — BPMN XML -> parsed model (bpmn-moddle)
export { parseBpmn } from './adapter/parseBpmn'

import { computeDiff } from './domain/diff'
import type { BpmnDiff } from './domain/model'
import { parseBpmn } from './adapter/parseBpmn'

/** Parse both BPMN documents and compute their diff. */
export async function diffBpmn(oldXml: string, newXml: string): Promise<BpmnDiff> {
  const [oldModel, newModel] = await Promise.all([parseBpmn(oldXml), parseBpmn(newXml)])
  return computeDiff(oldModel, newModel)
}
