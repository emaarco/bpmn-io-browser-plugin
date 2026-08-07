import DmnNavigatedViewer from 'dmn-js/lib/NavigatedViewer'
import { DMN_SHADOW_CSS } from '../styles/bundledCss'
import { resolveDiagramColors } from '../theme'
import { fitWithPadding, type FitCanvas } from '../viewer/fitWithPadding'
import type { DiagramKind, DiagramViewer } from './types'

export const dmnKind: DiagramKind = {
  id: 'dmn',
  label: 'DMN',
  css: DMN_SHADOW_CSS,
  async createViewer(canvas, xml): Promise<DiagramViewer> {
    const { stroke, fill } = resolveDiagramColors(canvas)
    const viewer = new DmnNavigatedViewer({
      container: canvas,
      drd: {
        // Colour the DRD from the host's tokens — the DMN analog of bpmn-js'
        // bpmnRenderer, so shapes/labels follow the page's light/dark theme.
        drdRenderer: {
          defaultFillColor: fill,
          defaultStrokeColor: stroke,
          defaultLabelColor: stroke,
        },
        zoomScroll: { enabled: false },
      },
    })
    try {
      await viewer.importXML(xml)
    } catch (err) {
      viewer.destroy()
      throw err
    }

    const activeCanvas = (): FitCanvas | undefined => {
      try {
        return viewer.getActiveViewer()?.get<FitCanvas>('canvas')
      } catch {
        return undefined
      }
    }

    try {
      activeCanvas()?.zoom('fit-viewport') // non-fatal (see createThemedViewer)
    } catch {
      /* re-fit happens from the panel */
    }

    return {
      fit: () => {
        const c = activeCanvas()
        // A touch more padding than the default: DRDs are sparse, so the extra
        // air reads better than a diagram pushed to the container edges.
        if (c) fitWithPadding(c, 64)
      },
      zoom: (factor) => {
        const c = activeCanvas()
        if (!c) return
        c.zoom(factor === 'fit' ? 'fit-viewport' : c.zoom() * factor)
      },
      destroy: () => viewer.destroy(),
    }
  },
}
