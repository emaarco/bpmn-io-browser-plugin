import DmnNavigatedViewer from 'dmn-js/lib/NavigatedViewer'
import { DMN_SHADOW_CSS } from '../styles/bundledCss'
import { fitWithPadding, type FitCanvas } from '../viewer/fitWithPadding'
import type { DiagramKind, DiagramViewer } from './types'

export const dmnKind: DiagramKind = {
  id: 'dmn',
  label: 'DMN',
  css: DMN_SHADOW_CSS,
  async createViewer(canvas, xml): Promise<DiagramViewer> {
    const viewer = new DmnNavigatedViewer({ container: canvas })
    try {
      await viewer.importXML(xml)
    } catch (err) {
      viewer.destroy()
      throw err
    }

    // A DMN file opens on its DRD, but the active view can change to a decision
    // table (plain HTML, no canvas) — so resolve the zoomable canvas each call
    // and no-op when the current view has none.
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
        if (c) fitWithPadding(c)
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
