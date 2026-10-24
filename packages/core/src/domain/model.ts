export type ModdleElement = {
  $type: string
  id?: string
  [key: string]: any
}

export interface Point {
  x: number
  y: number
}

export interface Bounds {
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface DiffElement extends Bounds {
  id: string
  businessObject: ModdleElement
  isConnection: boolean
  labelBounds?: Bounds
  waypoints?: Point[]
}

export type ParsedModel = Map<string, DiffElement>

export interface DiagramDiff {
  added: string[]
  removed: string[]
  changed: string[]
  moved: string[]
}
