import type { DiagramKind, DiagramViewer } from '../DiagramKind'
import { DMN } from '../kindCatalog'
import { DMN_ASSET_CSS, DMN_PANEL_CSS } from './dmnCss'
import { DmnViewer } from './DmnViewer'

export class DmnKind implements DiagramKind {
  readonly descriptor = DMN
  readonly css = DMN_PANEL_CSS
  readonly assetCss = DMN_ASSET_CSS
  readonly differ = null

  createViewer(canvas: HTMLElement, xml: string): Promise<DiagramViewer> {
    return DmnViewer.create(canvas, xml)
  }
}
