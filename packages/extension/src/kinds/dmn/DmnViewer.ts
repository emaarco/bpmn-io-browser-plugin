import DmnNavigatedViewer from 'dmn-js/lib/NavigatedViewer'
import { resolveDiagramColors } from '../../utils/hostTheme'
import { fitWithPadding, type FitCanvas } from '../../utils/fitWithPadding'
import { toggleZoomScroll } from '../../utils/zoomScroll'
import type { DiagramViewer } from '../DiagramKind'

const DMN_FIT_PADDING = 64

export class DmnViewer implements DiagramViewer {
  static async create(canvas: HTMLElement, xml: string): Promise<DmnViewer> {
    const { stroke, fill } = resolveDiagramColors(canvas)
    const viewer = new DmnNavigatedViewer({
      container: canvas,
      drd: {
        zoomScroll: { enabled: false },
        drdRenderer: {
          defaultFillColor: fill,
          defaultStrokeColor: stroke,
          defaultLabelColor: stroke,
        },
      },
    })
    try {
      await viewer.importXML(xml)
    } catch (err) {
      viewer.destroy()
      throw err
    }
    const dmnViewer = new DmnViewer(viewer)
    dmnViewer.fitViewportUnlessContainerIsUnmeasured()
    return dmnViewer
  }

  private constructor(private readonly viewer: DmnNavigatedViewer) {}

  fit(): void {
    const canvas = this.activeCanvas()
    if (canvas) fitWithPadding(canvas, DMN_FIT_PADDING)
  }

  zoomBy(factor: number): void {
    const canvas = this.activeCanvas()
    canvas?.zoom(canvas.zoom() * factor)
  }

  setInteractive(active: boolean): void {
    toggleZoomScroll(this.viewer.getActiveViewer(), active)
  }

  destroy(): void {
    this.viewer.destroy()
  }

  private activeCanvas(): FitCanvas | undefined {
    try {
      return this.viewer.getActiveViewer()?.get<FitCanvas>('canvas')
    } catch {
      return undefined
    }
  }

  private fitViewportUnlessContainerIsUnmeasured(): void {
    try {
      this.activeCanvas()?.zoom('fit-viewport')
    } catch {
      return
    }
  }
}
