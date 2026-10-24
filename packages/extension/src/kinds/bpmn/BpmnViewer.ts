import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer'
import { resolveDiagramColors } from '../../utils/hostTheme'
import { fitWithPadding } from '../../utils/fitWithPadding'
import { toggleZoomScroll } from '../../utils/zoomScroll'
import type { DiffableViewer } from '../DiagramKind'

export class BpmnViewer implements DiffableViewer {
  static async create(canvas: HTMLElement, xml: string): Promise<BpmnViewer> {
    const { stroke, fill } = resolveDiagramColors(canvas)
    const viewer = new NavigatedViewer({
      container: canvas,
      bpmnRenderer: { defaultStrokeColor: stroke, defaultFillColor: fill },
      zoomScroll: { enabled: false },
    })
    try {
      await viewer.importXML(xml)
    } catch (err) {
      viewer.destroy()
      throw err
    }
    const bpmnViewer = new BpmnViewer(viewer)
    bpmnViewer.fitViewportUnlessContainerIsUnmeasured()
    return bpmnViewer
  }

  private constructor(private readonly viewer: NavigatedViewer) {}

  fit(): void {
    fitWithPadding(this.canvas)
  }

  zoomBy(factor: number): void {
    this.canvas.zoom(this.canvas.zoom() * factor)
  }

  setInteractive(active: boolean): void {
    toggleZoomScroll(this.viewer, active)
  }

  hasElement(id: string): boolean {
    return Boolean(this.elementRegistry.get(id))
  }

  addMarker(id: string, marker: string): void {
    this.canvas.addMarker(id, marker)
  }

  removeMarker(id: string, marker: string): void {
    this.canvas.removeMarker(id, marker)
  }

  focusElement(id: string, zoom: number): void {
    const element = this.elementRegistry.get(id)
    if (!element) return
    this.canvas.zoom(zoom)
    this.canvas.scrollToElement(element)
  }

  destroy(): void {
    this.viewer.destroy()
  }

  private get canvas() {
    return this.viewer.get('canvas')
  }

  private get elementRegistry() {
    return this.viewer.get('elementRegistry')
  }

  private fitViewportUnlessContainerIsUnmeasured(): void {
    try {
      this.canvas.zoom('fit-viewport')
    } catch {
      return
    }
  }
}
