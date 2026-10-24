import type { DiagramKind, DiagramViewer } from '../DiagramKind'
import { BPMN } from '../kindCatalog'
import { BPMN_ASSET_CSS, BPMN_PANEL_CSS } from './bpmnCss'
import { BpmnDiffer } from './BpmnDiffer'
import { BpmnViewer } from './BpmnViewer'

export class BpmnKind implements DiagramKind {
  readonly descriptor = BPMN
  readonly css = BPMN_PANEL_CSS
  readonly assetCss = BPMN_ASSET_CSS
  readonly differ = new BpmnDiffer()

  createViewer(canvas: HTMLElement, xml: string): Promise<DiagramViewer> {
    return BpmnViewer.create(canvas, xml)
  }
}
