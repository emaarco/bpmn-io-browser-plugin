/**
 * Orchestrates the inline blob viewer on a git host page. We insert our own
 * full-width container with the rendered diagram (BPMN, DMN, …) **above** the
 * host's code, inside a shadow-root UI (so page CSS and the viewer library never
 * collide). This is additive — we never hide or move the host's code, so the
 * host re-rendering its code area (Code <-> Blame) can't leave us in a broken
 * half-state; we simply re-insert our container when it goes missing.
 *
 * `mountedPath` is the single source of truth: whenever our container no longer
 * matches the current URL — the user navigated to another file (SPA), or the
 * host dropped our node during a re-render — we re-sync.
 */

import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root'
import type { ContentScriptContext } from 'wxt/utils/content-script-context'
import { fetchText } from '../net/client'
import type { BlobPlatform } from '../platforms/types'
import { detectKind } from '../kinds/registry'
import { mountModelPanel, type ModelPanelHandle } from '../viewer/modelPanel'
import { injectShadowStyles } from './shadowStyles'

const HOST_TAG = 'git-diagram-viewer'
const MOUNT_RETRIES = 12
const RETRY_INTERVAL_MS = 500
const RECHECK_DEBOUNCE_MS = 200

export function runBlobViewer(ctx: ContentScriptContext, platform: BlobPlatform): void {
  let ui: { mount: () => void; remove: () => void } | null = null
  let mountedPath: string | null = null
  let mounting = false
  let restoreAnchor: (() => void) | null = null
  let retryTimer: ReturnType<typeof setInterval> | null = null

  const teardown = () => {
    restoreAnchor?.()
    restoreAnchor = null
    ui?.remove()
    ui = null
    mountedPath = null
  }

  /** True when our container is present and matches the current page. */
  const isCurrent = () => mountedPath === location.pathname && !!document.querySelector(HOST_TAG)

  const render = async (): Promise<boolean> => {
    if (mounting) return true
    const kind = platform.isBlob(location) ? detectKind(location.pathname) : null
    if (!kind) {
      teardown()
      return true
    }
    if (isCurrent()) return true

    const anchor = platform.findInsertAnchor(document)
    if (!anchor) return false // code area not rendered yet — let the caller retry

    teardown()
    mounting = true
    try {
      const path = location.pathname
      mountedPath = path
      const rawUrl = platform.rawUrl(location)

      // The host's top margin (to clear its sticky header) is just a gap now that
      // our diagram sits above the code; drop it while mounted, restore on teardown.
      const previousMarginTop = anchor.style.marginTop
      anchor.style.marginTop = '0'
      restoreAnchor = () => {
        anchor.style.marginTop = previousMarginTop
      }

      ui = await createShadowRootUi<ModelPanelHandle>(ctx, {
        name: HOST_TAG,
        position: 'inline',
        anchor,
        append: 'before',
        onMount: (uiContainer, shadow) => {
          injectShadowStyles(shadow, kind.css)
          return mountModelPanel(uiContainer, {
            kind,
            loadXml: () => fetchText(rawUrl),
          })
        },
        onRemove: (handle) => handle?.destroy(),
      })
      ui.mount()

      // Navigated away while mounting → this render is stale; drop it.
      if (path !== location.pathname) teardown()
    } catch (err) {
      // Surface it — a silent failure here just looks like the extension is dead.
      console.error('[git-diagram-viewer] could not mount the diagram viewer', err)
      teardown()
    } finally {
      mounting = false
    }
    return true
  }

  const stopRetry = () => {
    if (retryTimer) clearInterval(retryTimer)
    retryTimer = null
  }

  /** Bring the viewer in line with the current page, retrying while DOM settles. */
  const sync = () => {
    stopRetry()
    let attempts = 0
    void render().then((done) => {
      if (done) return
      retryTimer = setInterval(() => {
        attempts += 1
        const lastAttempt = attempts >= MOUNT_RETRIES
        void render().then((ok) => {
          if (ok || lastAttempt) stopRetry()
        })
      }, RETRY_INTERVAL_MS)
    })
  }

  // The platforms navigate client-side (WXT emits this) and re-render the code
  // area on their own; a debounced observer catches both, re-syncing whenever our
  // container is missing OR shows the wrong file.
  ctx.addEventListener(window, 'wxt:locationchange', sync)

  let scheduled = false
  const observer = new MutationObserver(() => {
    if (scheduled) return
    scheduled = true
    setTimeout(() => {
      scheduled = false
      if (mounting) return
      if (platform.isBlob(location) && detectKind(location.pathname) && !isCurrent()) sync()
    }, RECHECK_DEBOUNCE_MS)
  })
  observer.observe(document.body, { childList: true, subtree: true })

  ctx.onInvalidated(() => {
    observer.disconnect()
    stopRetry()
    teardown()
  })

  sync()
}
