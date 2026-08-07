/**
 * Host-agnostic driver for the inline merge/pull-request diff. Given a
 * {@link DiffPlatform}, it discovers changed diagram file boxes — re-running on
 * SPA navigation and debounced DOM mutations, since both hosts render file boxes
 * lazily — and mounts a shadow-root diff view additively above each file's code.
 * The host's own code diff stays visible below it.
 */

import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root'
import type { ContentScriptContext } from 'wxt/utils/content-script-context'
import { injectShadowStyles } from './shadowStyles'
import { DIFF_SHADOW_CSS } from '../styles/bundledCss'
import { mountDiffView, type DiffViewHandle } from '../diff/diffView'
import type { DiffFileBlock, DiffPlatform } from '../diff/diffPlatform'

const DEBOUNCE_MS = 300

export function runDiff(ctx: ContentScriptContext, platform: DiffPlatform): void {
  const mounted = new WeakSet<Element>()

  async function run(): Promise<void> {
    if (!platform.pageKey(location)) return
    let blocks: DiffFileBlock[]
    try {
      blocks = await platform.collect(location, document)
    } catch (err) {
      console.error('[git-diagram-viewer] failed to load diff data', err)
      return
    }
    for (const block of blocks) {
      if (mounted.has(block.anchor)) continue
      mounted.add(block.anchor)
      void mount(block)
    }
  }

  async function mount(block: DiffFileBlock): Promise<void> {
    const ui = await createShadowRootUi<DiffViewHandle>(ctx, {
      name: 'git-diagram-diff',
      position: 'inline',
      anchor: block.anchor,
      append: block.append,
      onMount: (container, shadow) => {
        injectShadowStyles(shadow, DIFF_SHADOW_CSS)
        return mountDiffView(container, { loadOld: block.loadOld, loadNew: block.loadNew })
      },
      onRemove: (handle) => handle?.destroy(),
    })
    ui.mount()
    ctx.onInvalidated(() => ui.remove())
  }

  let scheduled = false
  const schedule = () => {
    if (scheduled) return
    scheduled = true
    setTimeout(() => {
      scheduled = false
      void run()
    }, DEBOUNCE_MS)
  }

  ctx.addEventListener(window, 'wxt:locationchange', schedule)
  const observer = new MutationObserver(schedule)
  observer.observe(document.body, { childList: true, subtree: true })
  ctx.onInvalidated(() => observer.disconnect())

  void run()
}
