import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer'
import { resolveDiagramColors } from '../theme'

/**
 * Create a bpmn-js NavigatedViewer coloured from the host page's design tokens,
 * import the given XML and fit it to the viewport. Rejects (after cleaning up the
 * half-built viewer) when the XML can't be rendered.
 *
 * Both inline UIs — the blob viewer and the merge-request diff — render diagrams
 * this way, so the renderer-colour plumbing lives here rather than in each panel.
 */
export async function createThemedViewer(
  canvas: HTMLElement,
  xml: string,
): Promise<NavigatedViewer> {
  const { stroke, fill } = resolveDiagramColors(canvas)
  const viewer = new NavigatedViewer({
    container: canvas,
    bpmnRenderer: { defaultStrokeColor: stroke, defaultFillColor: fill },
    // Pan only by click-and-drag; don't hijack the wheel — scrolling over the
    // diagram scrolls the page. Zoom stays on the +/−/Fit buttons.
    zoomScroll: { enabled: false },
  })
  try {
    await viewer.importXML(xml)
  } catch (err) {
    viewer.destroy()
    throw err
  }
  // Non-fatal: in a zero-size container (a collapsed / not-yet-laid-out MR file
  // box) fit-viewport computes a non-finite scale and throws — but the import
  // already succeeded, and the caller re-fits once the container has a size.
  // Rethrowing here would replace the rendered diagram with a "render error".
  try {
    viewer.get('canvas').zoom('fit-viewport')
  } catch {
    /* re-fit happens from the panel */
  }
  return viewer
}
