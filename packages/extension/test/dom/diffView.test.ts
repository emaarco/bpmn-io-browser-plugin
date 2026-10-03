import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountDiffView, type DiffViewHandle } from '../../src/diff/diffView'

vi.mock('../../src/viewer/createThemedViewer', () => ({ createThemedViewer: vi.fn() }))

const LOADING_LABEL = 'Loading diagram…'

let diffView: DiffViewHandle | null = null

function mountWith(loadModel: () => Promise<string | null>): HTMLElement {
  const container = document.createElement('div')
  document.body.append(container)
  diffView = mountDiffView(container, { loadOld: loadModel, loadNew: loadModel })
  return container
}

afterEach(() => {
  diffView?.destroy()
  diffView = null
  document.body.innerHTML = ''
})

describe('mountDiffView', () => {
  it('shows a loading label while the models are still on their way', () => {
    const neverArrives = () => new Promise<string | null>(() => {})

    const container = mountWith(neverArrives)

    expect(container.textContent).toContain(LOADING_LABEL)
  })

  it('drops the loading label once the models have arrived', async () => {
    const fileDoesNotExist = async () => null

    const container = mountWith(fileDoesNotExist)

    await vi.waitFor(() =>
      expect(container.textContent).toContain('No current model (file deleted).'),
    )
    expect(container.textContent).not.toContain(LOADING_LABEL)
  })
})
