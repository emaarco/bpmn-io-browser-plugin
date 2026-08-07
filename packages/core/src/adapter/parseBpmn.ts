/**
 * Build a framework-free {@link ParsedModel} from BPMN 2.0 XML using bpmn-moddle.
 *
 * This replaces reading a live bpmn-js `elementRegistry`: we walk the BPMN DI
 * (the shapes/edges the viewer would render) and pair each with its resolved
 * semantic business object, plus its layout. Unregistered namespaces (e.g.
 * `zeebe:*`) are preserved by moddle as generic `$attrs`/`extensionElements`, so
 * the semantic diff still sees their property changes.
 */

import { BpmnModdle } from 'bpmn-moddle'
import type { ModdleElement } from 'bpmn-moddle'
import type { DiffElement, ParsedModel } from '../domain/model'

export async function parseBpmn(xml: string): Promise<ParsedModel> {
  const moddle = new BpmnModdle()
  const { rootElement } = await moddle.fromXML(xml)
  return buildModel(rootElement)
}

function buildModel(definitions: ModdleElement): ParsedModel {
  const model: ParsedModel = new Map()
  const diagrams: ModdleElement[] = definitions?.diagrams ?? []

  for (const diagram of diagrams) {
    const plane: ModdleElement | undefined = diagram?.plane
    if (!plane) continue

    // The plane's own bpmnElement is the diagram root (process/collaboration).
    // It carries no shape, but its semantic properties can still change.
    addRoot(model, plane.bpmnElement)

    for (const di of plane.planeElement ?? []) {
      addDiElement(model, di)
    }
  }

  return model
}

function addRoot(model: ParsedModel, semantic: ModdleElement | undefined): void {
  if (!semantic?.id || model.has(semantic.id)) return
  model.set(semantic.id, { id: semantic.id, businessObject: semantic, isConnection: false })
}

function addDiElement(model: ParsedModel, di: ModdleElement): void {
  const semantic: ModdleElement | undefined = di?.bpmnElement
  if (!semantic?.id) return

  const waypoints = Array.isArray(di.waypoint)
    ? di.waypoint.map((p: ModdleElement) => ({ x: p.x, y: p.y }))
    : undefined
  const isConnection = di.$type === 'bpmndi:BPMNEdge' || waypoints !== undefined

  const element: DiffElement = { id: semantic.id, businessObject: semantic, isConnection }

  const bounds: ModdleElement | undefined = di.bounds
  if (bounds) {
    element.x = bounds.x
    element.y = bounds.y
    element.width = bounds.width
    element.height = bounds.height
  }
  if (waypoints) element.waypoints = waypoints

  model.set(semantic.id, element)
}
