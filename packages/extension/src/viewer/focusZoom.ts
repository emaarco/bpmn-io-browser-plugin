/**
 * Enable wheel zoom only while the pane is focused — clicked into, not merely
 * hovered — so scrolling past the diagram never traps the page scroll. Focus is
 * released on click-away or when the pointer leaves. Returns a detach fn.
 */
export function enableFocusZoom(
  pane: HTMLElement,
  setActive: (active: boolean) => void,
): () => void {
  let active = false
  const set = (next: boolean): void => {
    if (next === active) return
    active = next
    setActive(next)
    pane.classList.toggle('is-active', next)
  }

  const onPointerDown = (): void => set(true)
  const onLeave = (): void => set(false)
  const onDocDown = (event: Event): void => {
    if (!event.composedPath().includes(pane)) set(false)
  }

  pane.addEventListener('pointerdown', onPointerDown)
  pane.addEventListener('mouseleave', onLeave)
  document.addEventListener('pointerdown', onDocDown, true)

  return () => {
    set(false)
    pane.removeEventListener('pointerdown', onPointerDown)
    pane.removeEventListener('mouseleave', onLeave)
    document.removeEventListener('pointerdown', onDocDown, true)
  }
}
