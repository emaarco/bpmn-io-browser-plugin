/**
 * Host-agnostic driver for the inline merge/pull-request diff. Given a
 * {@link DiffPlatform}, it discovers changed diagram file boxes — re-running on
 * SPA navigation and debounced DOM mutations, since both hosts render file boxes
 * lazily — and mounts a shadow-root diff view additively above each file's code.
 * The host's own code diff stays visible below it.
 */

import type { ContentScriptContext } from 'wxt/utils/content-script-context'
import { mountShadowPanel, onDomChange, onHostPageChange } from './hostDomSync'
import { DIFF_SHADOW_CSS } from '../styles/bundledCss'
import { mountDiffView, type DiffViewHandle } from '../diff/diffView'
import { mountDiffError } from '../diff/diffError'
import {
  DiffDataError,
  type DiffFileBlock,
  type DiffPanelSlot,
  type DiffPlatform,
} from '../diff/diffPlatform'
import { DIFF_ERROR_TAG, DIFF_PANEL_TAG } from './tags'

const DEBOUNCE_MS = 300
const COLLAPSE_DEBOUNCE_MS = 150

const wasReplacedByHost = (slot: DiffPanelSlot) => !slot.anchor.isConnected

export function runDiff(ctx: ContentScriptContext, platform: DiffPlatform): void {
  // File roots with a mount currently in flight. Durable de-duplication is done
  // against the DOM (does this file root already contain our panel?), not against
  // a code element's identity, which GitHub re-creates when Viewed is toggled.
  const mounting = new WeakSet<Element>()
  const erroring = new WeakSet<Element>()

  async function run(): Promise<void> {
    if (!platform.pageKey(location)) return
    let blocks: DiffFileBlock[]
    try {
      blocks = await platform.collect(location, document)
    } catch (err) {
      if (err instanceof DiffDataError) showErrors(err)
      else console.error('[bpmn-io-browser-plugin] failed to load diff data', err)
      return
    }
    for (const block of blocks) {
      if (wasReplacedByHost(block)) continue
      if (mounting.has(block.fileRoot)) continue
      if (block.fileRoot.querySelector(DIFF_PANEL_TAG)) continue
      // A retry finally succeeded — drop any error notice we mounted earlier.
      block.fileRoot.querySelector(DIFF_ERROR_TAG)?.remove()
      mounting.add(block.fileRoot)
      void mount(block).finally(() => mounting.delete(block.fileRoot))
    }
  }

  /** Surface a metadata-load failure as a notice above each affected file's code. */
  function showErrors(err: DiffDataError): void {
    for (const slot of err.slots) {
      if (wasReplacedByHost(slot)) continue
      if (erroring.has(slot.fileRoot)) continue
      // Never cover a real panel, and never stack a second notice.
      if (slot.fileRoot.querySelector(DIFF_PANEL_TAG)) continue
      if (slot.fileRoot.querySelector(DIFF_ERROR_TAG)) continue
      erroring.add(slot.fileRoot)
      void mountError(slot, err).finally(() => erroring.delete(slot.fileRoot))
    }
  }

  async function mountError(slot: DiffPanelSlot, err: DiffDataError): Promise<void> {
    const ui = await mountShadowPanel(ctx, {
      name: DIFF_ERROR_TAG,
      anchor: slot.anchor,
      append: slot.append,
      css: DIFF_SHADOW_CSS,
      render: (container) => mountDiffError(container, { message: err.message, hint: err.hint }),
    })
    ctx.onInvalidated(() => ui.remove())
  }

  async function mount(block: DiffFileBlock): Promise<void> {
    const ui = await mountShadowPanel(ctx, {
      name: DIFF_PANEL_TAG,
      anchor: block.anchor,
      append: block.append,
      css: DIFF_SHADOW_CSS,
      render: (container) =>
        mountDiffView(container, { loadOld: block.loadOld, loadNew: block.loadNew }),
    })
    ctx.onInvalidated(() => ui.remove())
    mirrorCollapse(ui, block)
  }

  /**
   * Hide the injected panel whenever the host collapses the file (e.g. "marked as
   * viewed"), and re-fit the diagram when it is expanded again. Mirrors the host's
   * own diff-body visibility rather than matching version-specific collapse markup.
   */
  function mirrorCollapse(
    ui: { shadowHost: HTMLElement; mounted?: DiffViewHandle },
    block: DiffFileBlock,
  ): void {
    let wasHidden = false
    const sync = () => {
      const collapsed = block.isCollapsed()
      if (collapsed) ui.shadowHost.setAttribute('data-collapsed', '')
      else ui.shadowHost.removeAttribute('data-collapsed')
      if (!collapsed && wasHidden) ui.mounted?.refit()
      wasHidden = collapsed
    }

    onDomChange(
      ctx,
      block.fileRoot,
      { attributes: true, childList: true, subtree: true },
      COLLAPSE_DEBOUNCE_MS,
      sync,
    )

    // Handle files that load already collapsed (GitLab starts viewed files collapsed).
    sync()
  }

  onHostPageChange(ctx, DEBOUNCE_MS, () => void run())
  void run()
}
