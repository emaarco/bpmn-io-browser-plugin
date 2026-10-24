interface DiagramServices {
  get<T>(name: string): T
}

interface ZoomScroll {
  toggle(enabled: boolean): void
}

export function toggleZoomScroll(
  diagram: DiagramServices | null | undefined,
  active: boolean,
): void {
  try {
    diagram?.get<ZoomScroll>('zoomScroll').toggle(active)
  } catch {
    return
  }
}
