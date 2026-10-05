/**
 * Deep, order-stable signature of a moddle business object.
 *
 * Ported from the "BPMN Diff" userscript (v2.5). A change is detected whenever
 * this signature differs, so it must include everything that matters semantically
 * — including `$attrs`, `$children` and `$body`, where properties of unregistered
 * namespaces (e.g. `zeebe:*`) live — while skipping layout (`di`), back-references
 * and child/reference collections that would otherwise cause false positives or
 * infinite recursion.
 *
 * References to other diagram elements are compared by id only (not followed),
 * since those are diffed as elements in their own right. Referenced elements
 * without a shape of their own (messages, errors, a pool's process, …) are folded
 * into the signature instead — otherwise their changes would surface nowhere.
 */

import type { ModdleElement, ParsedModel } from './model'

type DiagramElements = Pick<ParsedModel, 'has'>

/**
 * Internal moddle keys plus layout and child/reference collections. These are
 * either noise (back-references, descriptors) or are compared elsewhere (children
 * as their own elements, layout via the DI shapes/edges).
 */
const SKIP_KEYS = new Set<string>([
  '$parent',
  '$descriptor',
  '$model',
  '$instanceOf',
  'di',
  'flowElements',
  'incoming',
  'outgoing',
  'lanes',
  'laneSets',
  'children',
  'artifacts',
  'rootElements',
  'diagrams',
  // Collaboration collections: pools and message flows are diagram elements in
  // their own right (each has a DI shape/edge) and are diffed separately, so the
  // collaboration root must not fold them into its own signature.
  'participants',
  'messageFlows',
])

const MAX_DEPTH = 16

/**
 * moddle defines reference properties (`sourceRef`, `messageRef`, …) as
 * non-enumerable, so they have to be read off the type descriptor.
 */
function semanticKeys(node: any): string[] {
  const references: string[] = (node.$descriptor?.properties ?? [])
    .filter((property: any) => property.isReference)
    .map((property: any) => property.name)
  return [...new Set([...Object.keys(node), ...references])].sort()
}

function serialize(
  node: any,
  diagramElements: DiagramElements,
  seen: Set<object>,
  depth: number,
): unknown {
  if (node === null || typeof node !== 'object') return node
  if (depth > MAX_DEPTH) return '__max__'
  if (Array.isArray(node)) return node.map((x) => serialize(x, diagramElements, seen, depth + 1))
  // Reference to another diagram element -> compare by id only (don't recurse).
  if (diagramElements.has(node.id)) return 'ref:' + node.id
  if (seen.has(node)) return '__cycle__'
  seen.add(node)

  const out: Record<string, any> = {}
  if (node.$type) out.__type = node.$type

  for (const k of semanticKeys(node)) {
    if (k === '$type' || SKIP_KEYS.has(k)) continue
    const v = node[k]
    if (typeof v === 'function' || v === undefined) continue
    out[k] = serialize(v, diagramElements, seen, depth + 1)
  }

  seen.delete(node)
  return out
}

/** Stable JSON signature of a business object's semantic content. */
export function signature(businessObject: ModdleElement, diagramElements: DiagramElements): string {
  const otherDiagramElements: DiagramElements = {
    has: (id) => id !== businessObject.id && diagramElements.has(id),
  }
  return JSON.stringify(serialize(businessObject, otherDiagramElements, new Set(), 0))
}
