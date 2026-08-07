/**
 * A diagram-js `canvas` service, narrowed to what fitting needs. bpmn-js and
 * dmn-js both expose one with this shape.
 */
export interface FitCanvas {
  resized(): void
  zoom(level?: number | string): number
  viewbox(box?: ViewboxBox): Viewbox
}

interface ViewboxBox {
  x: number
  y: number
  width: number
  height: number
}

interface Viewbox extends ViewboxBox {
  scale: number
  /** The content bounding box, in diagram (world) coordinates. */
  inner: ViewboxBox
  /** The viewport size, in CSS pixels. */
  outer: { width: number; height: number }
}

/**
 * Fit the diagram into the viewport, centred, with a margin on every side.
 *
 * Rolled by hand rather than via `zoom('fit-viewport')` for two reasons:
 *  - fit-viewport fits the element *bounding box* with zero padding, so external
 *    labels (gateway/event captions) that render outside the box get clipped.
 *  - for content smaller than the viewport it anchors instead of centring, so the
 *    diagram sits at the top with the slack pooling at the bottom.
 *
 * We instead scale the content bbox to fit inside `viewport − 2·pad` and place a
 * viewbox centred on the content — guaranteeing both the margin and true centring
 * regardless of diagram size or aspect ratio.
 */
export function fitWithPadding(canvas: FitCanvas, pad = 48): void {
  canvas.resized()
  const vb = canvas.viewbox()
  const inner = vb?.inner
  const outer = vb?.outer
  if (!inner?.width || !inner?.height || !outer?.width || !outer?.height) return

  // Fit content + margin in both dimensions, but never enlarge past 1:1.
  const fit = (p: number) =>
    Math.min(1, (outer.width - p * 2) / inner.width, (outer.height - p * 2) / inner.height)
  // Prefer the padded fit; if the pane is too small for the margin, drop it.
  let scale = fit(pad)
  if (scale <= 0) scale = fit(0)
  // A non-finite / non-positive scale means the container isn't measurable yet
  // (zero size). Bail rather than feed a bad value into SVGMatrix (which throws).
  if (!Number.isFinite(scale) || scale <= 0) return

  // A full-viewport viewbox in world units, centred on the content bbox.
  const width = outer.width / scale
  const height = outer.height / scale
  const x = inner.x + inner.width / 2 - width / 2
  const y = inner.y + inner.height / 2 - height / 2
  if (![x, y, width, height].every(Number.isFinite)) return
  canvas.viewbox({ x, y, width, height })
}
