import type { DiagramDiffer, DiagramKind, DiagramViewer } from '../../src/kinds/DiagramKind'
import { BPMN } from '../../src/kinds/kindCatalog'
import { FakeDiffableViewer } from './FakeDiffableViewer'
import { FakeDiffer } from './FakeDiffer'

export class FakeKind implements DiagramKind {
  readonly css = ''
  readonly assetCss = ''

  constructor(
    readonly descriptor = BPMN,
    readonly differ: DiagramDiffer | null = new FakeDiffer(),
  ) {}

  async createViewer(canvas: HTMLElement): Promise<DiagramViewer> {
    canvas.append(Object.assign(document.createElement('svg'), { className: 'fake-diagram' }))
    return new FakeDiffableViewer()
  }
}
