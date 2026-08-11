import { createThemedViewer } from '../viewer/createThemedViewer'
import { fitWithPadding } from '../viewer/fitWithPadding'
import { toggleZoomScroll } from '../viewer/zoomScroll'
import { BPMN_SHADOW_CSS } from '../styles/bundledCss'
import type { DiagramKind, DiagramViewer } from './types'

export const bpmnKind: DiagramKind = {
  id: 'bpmn',
  label: 'BPMN',
  css: BPMN_SHADOW_CSS,
  async createViewer(canvas, xml): Promise<DiagramViewer> {
    const viewer = await createThemedViewer(canvas, xml)
    const bpmnCanvas = viewer.get('canvas')
    return {
      fit: () => fitWithPadding(bpmnCanvas),
      zoom: (factor) =>
        bpmnCanvas.zoom(factor === 'fit' ? 'fit-viewport' : bpmnCanvas.zoom() * factor),
      setInteractive: (active) => toggleZoomScroll(viewer, active),
      destroy: () => viewer.destroy(),
    }
  },
}
