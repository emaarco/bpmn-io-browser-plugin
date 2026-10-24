import { BpmnModelDiffer, type DiagramDiff } from '@bpmn-io-browser-plugin/core'
import type { DiagramDiffer, DiffableViewer } from '../DiagramKind'
import { BPMN_DIFF_CSS } from './bpmnCss'
import { BpmnViewer } from './BpmnViewer'

export class BpmnDiffer implements DiagramDiffer {
  readonly css = BPMN_DIFF_CSS
  private readonly models = new BpmnModelDiffer()

  diff(oldXml: string, newXml: string): Promise<DiagramDiff> {
    return this.models.diff(oldXml, newXml)
  }

  createViewer(canvas: HTMLElement, xml: string): Promise<DiffableViewer> {
    return BpmnViewer.create(canvas, xml)
  }
}
