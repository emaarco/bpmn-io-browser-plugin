import type { DiagramDiff } from '@bpmn-io-browser-plugin/core'
import type { KindDescriptor } from './kindCatalog'

export interface DiagramViewer {
  fit(): void
  zoomBy(factor: number): void
  setInteractive(active: boolean): void
  destroy(): void
}

export interface DiffableViewer extends DiagramViewer {
  hasElement(id: string): boolean
  addMarker(id: string, marker: string): void
  removeMarker(id: string, marker: string): void
  focusElement(id: string, zoom: number): void
}

export interface DiagramDiffer {
  readonly css: string
  diff(oldXml: string, newXml: string): Promise<DiagramDiff>
  createViewer(canvas: HTMLElement, xml: string): Promise<DiffableViewer>
}

export interface DiagramKind {
  readonly descriptor: KindDescriptor
  readonly css: string
  readonly assetCss: string
  readonly differ: DiagramDiffer | null
  createViewer(canvas: HTMLElement, xml: string): Promise<DiagramViewer>
}

export interface KindLookup {
  detect(path: string | null | undefined): DiagramKind | null
}
