import { afterEach, describe, expect, it, vi } from 'vitest'
import { DiffDataError, type DiffSource } from '../../src/diff/DiffSource'
import { DIFF_ERROR_TAG, DIFF_PANEL_TAG } from '../../src/injectedElements'
import { DiffController } from '../../src/page/DiffController'
import { HostPage } from '../../src/page/HostPage'
import { FakeContentScriptContext } from '../fakes/FakeContentScriptContext'
import { FakeKindLookup } from '../fakes/FakeKindLookup'

const RERUN_DEBOUNCE_MS = 300

const context = new FakeContentScriptContext()

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void
  const promise = new Promise<void>((done) => (resolve = done))
  return { promise, resolve }
}

function renderFileBox(): HTMLElement {
  document.body.innerHTML = '<div class="file"><div class="code"></div></div>'
  return document.querySelector<HTMLElement>('.file')!
}

function sourceShowing(
  fileRoot: HTMLElement,
  metadata: Promise<void>,
  path = 'flows/order.bpmn',
): DiffSource {
  return {
    pageKey: () => 'octo/flows!1',
    async collect() {
      const code = fileRoot.querySelector<HTMLElement>('.code')!
      await metadata
      return [
        {
          path,
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

function start(source: DiffSource): void {
  new DiffController(new HostPage(context.ctx), source, new FakeKindLookup()).start()
}

const untilRerunStarted = () =>
  new Promise((resolve) => setTimeout(resolve, RERUN_DEBOUNCE_MS + 100))

afterEach(() => {
  context.invalidate()
  document.body.innerHTML = ''
})

describe('DiffController', () => {
  it('mounts the panel above the code of a changed diagram file', async () => {
    const fileRoot = renderFileBox()
    const metadata = deferred()
    start(sourceShowing(fileRoot, metadata.promise))

    metadata.resolve()

    const code = fileRoot.querySelector('.code')!
    await vi.waitFor(() => expect(code.previousElementSibling?.localName).toBe(DIFF_PANEL_TAG))
  })

  it('mounts the panel above the code the host re-rendered while metadata was loading', async () => {
    const fileRoot = renderFileBox()
    const metadata = deferred()
    start(sourceShowing(fileRoot, metadata.promise))

    const codeScannedBeforeMetadataArrived = fileRoot.querySelector('.code')!
    const reRenderedCode = codeScannedBeforeMetadataArrived.cloneNode(true) as HTMLElement
    codeScannedBeforeMetadataArrived.replaceWith(reRenderedCode)
    await untilRerunStarted()
    metadata.resolve()

    await vi.waitFor(() =>
      expect(reRenderedCode.previousElementSibling?.localName).toBe(DIFF_PANEL_TAG),
    )
  })

  it('leaves files of a kind without diff support alone', async () => {
    const fileRoot = renderFileBox()
    start(sourceShowing(fileRoot, Promise.resolve(), 'rules/decide.dmn'))

    await untilRerunStarted()

    expect(fileRoot.querySelector(DIFF_PANEL_TAG)).toBeNull()
  })

  it('shows an error notice above each file when the metadata cannot be loaded', async () => {
    const fileRoot = renderFileBox()
    const code = fileRoot.querySelector<HTMLElement>('.code')!
    const failing: DiffSource = {
      pageKey: () => 'octo/flows!1',
      collect: async () => {
        throw new DiffDataError('HTTP 404', 'Connect the app.', [
          {
            path: 'flows/order.bpmn',
            anchor: code,
            append: 'before',
            fileRoot,
            isCollapsed: () => false,
          },
        ])
      },
    }

    start(failing)

    await vi.waitFor(() => expect(code.previousElementSibling?.localName).toBe(DIFF_ERROR_TAG))
  })
})
