import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ContentScriptContext } from 'wxt/utils/content-script-context'
import type { DiffPlatform } from '../../src/diff/diffPlatform'
import { runDiff } from '../../src/inject/diffRunner'
import { DIFF_PANEL_TAG } from '../../src/inject/tags'

vi.mock('../../src/diff/diffView', () => ({ mountDiffView: vi.fn() }))
vi.mock('../../src/diff/diffError', () => ({ mountDiffError: vi.fn() }))
vi.mock('../../src/styles/bundledCss', () => ({ DIFF_SHADOW_CSS: '' }))

const RERUN_DEBOUNCE_MS = 300

const invalidationListeners: Array<() => void> = []

const contentScriptContext = {
  addEventListener: vi.fn(),
  onInvalidated: (listener: () => void) => invalidationListeners.push(listener),
} as unknown as ContentScriptContext

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void
  const promise = new Promise<void>((done) => (resolve = done))
  return { promise, resolve }
}

function renderFileBox(): HTMLElement {
  document.body.innerHTML = '<div class="file"><div class="code"></div></div>'
  return document.querySelector<HTMLElement>('.file')!
}

function platformShowing(fileRoot: HTMLElement, metadata: Promise<void>): DiffPlatform {
  return {
    pageKey: () => 'octo/flows!1',
    async collect() {
      const code = fileRoot.querySelector<HTMLElement>('.code')!
      await metadata
      return [
        {
          path: 'flows/order.bpmn',
          anchor: code,
          append: 'before',
          fileRoot,
          isCollapsed: () => false,
          loadOld: async () => null,
          loadNew: async () => null,
        },
      ]
    },
  }
}

const untilRerunStarted = () =>
  new Promise((resolve) => setTimeout(resolve, RERUN_DEBOUNCE_MS + 100))

afterEach(() => {
  invalidationListeners.splice(0).forEach((invalidate) => invalidate())
  document.body.innerHTML = ''
})

describe('runDiff', () => {
  it('mounts the panel above the code of a changed diagram file', async () => {
    const fileRoot = renderFileBox()
    const metadata = deferred()
    runDiff(contentScriptContext, platformShowing(fileRoot, metadata.promise))

    metadata.resolve()

    const code = fileRoot.querySelector('.code')!
    await vi.waitFor(() => expect(code.previousElementSibling?.localName).toBe(DIFF_PANEL_TAG))
  })

  it('mounts the panel above the code the host re-rendered while metadata was loading', async () => {
    const fileRoot = renderFileBox()
    const metadata = deferred()
    runDiff(contentScriptContext, platformShowing(fileRoot, metadata.promise))

    const codeScannedBeforeMetadataArrived = fileRoot.querySelector('.code')!
    const reRenderedCode = codeScannedBeforeMetadataArrived.cloneNode(true) as HTMLElement
    codeScannedBeforeMetadataArrived.replaceWith(reRenderedCode)
    await untilRerunStarted()
    metadata.resolve()

    await vi.waitFor(() =>
      expect(reRenderedCode.previousElementSibling?.localName).toBe(DIFF_PANEL_TAG),
    )
  })
})
