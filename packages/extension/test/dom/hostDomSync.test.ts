import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ContentScriptContext } from 'wxt/utils/content-script-context'
import { onHostPageChange } from '../../src/inject/hostDomSync'

const invalidationListeners: Array<() => void> = []
const navigationListeners: Array<() => void> = []

const contentScriptContext = {
  addEventListener: (_target: unknown, _type: string, listener: () => void) =>
    navigationListeners.push(listener),
  onInvalidated: (listener: () => void) => invalidationListeners.push(listener),
} as unknown as ContentScriptContext

const flushMutations = () => new Promise((resolve) => setTimeout(resolve, 0))

afterEach(() => {
  invalidationListeners.splice(0).forEach((listener) => listener())
  navigationListeners.length = 0
  document.body.innerHTML = ''
})

describe('onHostPageChange', () => {
  it('collapses a burst of DOM changes and navigation into one call', async () => {
    const onChange = vi.fn()
    onHostPageChange(contentScriptContext, 50, onChange)

    document.body.append(document.createElement('div'))
    document.body.append(document.createElement('div'))
    navigationListeners.forEach((listener) => listener())
    await flushMutations()
    await new Promise((resolve) => setTimeout(resolve, 60))

    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('stops reacting once the content script is invalidated', async () => {
    const onChange = vi.fn()
    onHostPageChange(contentScriptContext, 10, onChange)

    invalidationListeners.splice(0).forEach((listener) => listener())
    document.body.append(document.createElement('div'))
    await new Promise((resolve) => setTimeout(resolve, 30))

    expect(onChange).not.toHaveBeenCalled()
  })
})
