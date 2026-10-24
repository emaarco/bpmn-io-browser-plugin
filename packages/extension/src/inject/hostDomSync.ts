/**
 * Keeps our shadow-root panels in step with a host page that renders lazily and
 * navigates client-side: debounced change notifications and a one-call inline
 * panel mount.
 */

import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root'
import type { ContentScriptContext } from 'wxt/utils/content-script-context'
import { injectShadowStyles } from './shadowStyles'

/** Call `onChange` at most once per `delayMs` while `target` mutates; returns the trigger. */
export function onDomChange(
  ctx: ContentScriptContext,
  target: Node,
  init: MutationObserverInit,
  delayMs: number,
  onChange: () => void,
): () => void {
  let scheduled = false
  const schedule = () => {
    if (scheduled) return
    scheduled = true
    setTimeout(() => {
      scheduled = false
      onChange()
    }, delayMs)
  }
  const observer = new MutationObserver(schedule)
  observer.observe(target, init)
  ctx.onInvalidated(() => observer.disconnect())
  return schedule
}

/** Debounced `onChange` on client-side navigation and on any change to the page body. */
export function onHostPageChange(
  ctx: ContentScriptContext,
  delayMs: number,
  onChange: () => void,
): void {
  const schedule = onDomChange(
    ctx,
    document.body,
    { childList: true, subtree: true },
    delayMs,
    onChange,
  )
  ctx.addEventListener(window, 'wxt:locationchange', schedule)
}

export interface ShadowPanelOptions<Handle extends { destroy(): void }> {
  name: string
  anchor: HTMLElement
  append: 'first' | 'before'
  css: string
  render: (container: HTMLElement) => Handle
}

/** Mount an inline shadow-root panel next to `anchor`, styled with `css`. */
export async function mountShadowPanel<Handle extends { destroy(): void }>(
  ctx: ContentScriptContext,
  { name, anchor, append, css, render }: ShadowPanelOptions<Handle>,
) {
  const ui = await createShadowRootUi<Handle>(ctx, {
    name,
    position: 'inline',
    anchor,
    append,
    onMount: (container, shadow) => {
      injectShadowStyles(shadow, css)
      return render(container)
    },
    onRemove: (handle) => handle?.destroy(),
  })
  ui.mount()
  return ui
}
