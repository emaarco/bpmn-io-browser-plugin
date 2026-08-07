/**
 * True when the element is in the document and currently laid out (has a box).
 * A display:none element (self or ancestor) or a detached node has no client
 * rects; a merely scrolled-away element still does — so this reads as "the host
 * is actually showing this element", not "it's on screen". Used to mirror the
 * host's collapse (mark-as-viewed) state onto our injected diff panel.
 */
export function isRendered(el: Element | null | undefined): boolean {
  return !!el && el.isConnected && el.getClientRects().length > 0
}
