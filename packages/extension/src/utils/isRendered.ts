export function isRendered(el: Element | null | undefined): boolean {
  return !!el && el.isConnected && el.getClientRects().length > 0
}

export function hasRenderedBox(el: Element): boolean {
  return isRendered(el) && el.getBoundingClientRect().height > 0
}
