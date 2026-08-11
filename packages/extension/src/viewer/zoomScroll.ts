interface DiagramServices {
  get<T>(name: string): T
}

interface ZoomScroll {
  toggle(enabled: boolean): void
}

/**
 * Toggle a diagram-js viewer's wheel `zoomScroll`. No-op when the instance is
 * missing or has no zoomScroll module (e.g. a DMN decision-table view), so
 * callers can pass a not-yet-loaded viewer without guarding.
 */
export function toggleZoomScroll(
  diagram: DiagramServices | null | undefined,
  active: boolean,
): void {
  try {
    diagram?.get<ZoomScroll>('zoomScroll').toggle(active)
  } catch {
    /* no zoomScroll module for this view */
  }
}
