import type { BlobPage } from '../git-hosts/BlobPage'
import { HOST_TAG } from '../injectedElements'
import type { KindLookup } from '../kinds/DiagramKind'
import { allKinds } from '../kinds/allKinds'
import { ModelPanel } from '../panels/ModelPanel'
import type { HostPage, ShadowPanel } from './HostPage'

const MOUNT_RETRIES = 12
const RETRY_INTERVAL_MS = 500
const RECHECK_DEBOUNCE_MS = 200

type MountOutcome = 'settled' | 'code-not-rendered-yet'

export class BlobViewerController {
  private panel: ShadowPanel<ModelPanel> | null = null
  private mountedPath: string | null = null
  private mounting = false
  private restoreAnchor: (() => void) | null = null
  private retryTimer: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly page: HostPage,
    private readonly blobPage: BlobPage,
    private readonly kinds: KindLookup = allKinds,
  ) {}

  start(): void {
    this.page.onChange(RECHECK_DEBOUNCE_MS, () => {
      if (!this.mounting && this.isOutOfSync()) this.sync()
    })
    this.page.onInvalidated(() => {
      this.stopRetry()
      this.teardown()
    })
    this.sync()
  }

  private sync(): void {
    this.stopRetry()
    let attempts = 0
    void this.render().then((outcome) => {
      if (outcome === 'settled') return
      this.retryTimer = setInterval(() => {
        attempts += 1
        const lastAttempt = attempts >= MOUNT_RETRIES
        void this.render().then((retried) => {
          if (retried === 'settled' || lastAttempt) this.stopRetry()
        })
      }, RETRY_INTERVAL_MS)
    })
  }

  private async render(): Promise<MountOutcome> {
    if (this.mounting) return 'settled'
    const { location, document } = this.page
    const kind = this.blobPage.isBlob(location) ? this.kinds.detect(location.pathname) : null
    if (!kind) {
      this.teardown()
      return 'settled'
    }
    if (this.isCurrent()) return 'settled'

    const anchor = this.blobPage.findInsertAnchor(document)
    if (!anchor) return 'code-not-rendered-yet'

    this.teardown()
    this.mounting = true
    try {
      const path = location.pathname
      this.mountedPath = path
      this.dropStickyHeaderGap(anchor)
      const loadXml = this.blobPage.fileLoader(location)
      this.panel = await this.page.mountPanel({
        name: HOST_TAG,
        anchor,
        append: 'before',
        css: kind.css,
        render: (container) => new ModelPanel({ kind, loadXml }).mount(container),
      })
      const navigatedAwayWhileMounting = path !== this.page.location.pathname
      if (navigatedAwayWhileMounting) this.teardown()
    } catch (err) {
      console.error('[bpmn-io-browser-plugin] could not mount the diagram viewer', err)
      this.teardown()
    } finally {
      this.mounting = false
    }
    return 'settled'
  }

  private dropStickyHeaderGap(anchor: HTMLElement): void {
    const previousMarginTop = anchor.style.marginTop
    anchor.style.marginTop = '0'
    this.restoreAnchor = () => {
      anchor.style.marginTop = previousMarginTop
    }
  }

  private isCurrent(): boolean {
    return (
      this.mountedPath === this.page.location.pathname &&
      !!this.page.document.querySelector(HOST_TAG)
    )
  }

  private isOutOfSync(): boolean {
    return this.blobPage.showsDiagram(this.page.location)
      ? !this.isCurrent()
      : this.mountedPath !== null
  }

  private teardown(): void {
    this.restoreAnchor?.()
    this.restoreAnchor = null
    this.panel?.remove()
    this.panel = null
    this.mountedPath = null
  }

  private stopRetry(): void {
    if (this.retryTimer) clearInterval(this.retryTimer)
    this.retryTimer = null
  }
}
