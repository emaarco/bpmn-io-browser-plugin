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
 * References to other diagram elements are compared by id only (not followed).
 */

import type { ModdleElement } from './model'

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

function serialize(node: any, seen: Set<object>, depth: number): unknown {
  if (node === null || typeof node !== 'object') return node
  if (depth > MAX_DEPTH) return '__max__'
  if (Array.isArray(node)) return node.map((x) => serialize(x, seen, depth + 1))
  if (seen.has(node)) return '__cycle__'
  seen.add(node)

  const out: Record<string, any> = {}
  if (node.$type) out.__type = node.$type

  for (const k of Object.keys(node).sort()) {
    if (k === '$type' || SKIP_KEYS.has(k)) continue
    const v = node[k]
    if (typeof v === 'function' || v === undefined) continue
    // Reference to another diagram element -> compare by id only (don't recurse).
    if (v && typeof v === 'object' && !Array.isArray(v) && v.id) {
      out[k] = 'ref:' + v.id
      continue
    }
    out[k] = serialize(v, seen, depth + 1)
  }

  seen.delete(node)
  return out
}

/** Stable JSON signature of a business object's semantic content. */
export function signature(businessObject: ModdleElement): string {
  return JSON.stringify(serialize(businessObject, new Set(), 0))
}
