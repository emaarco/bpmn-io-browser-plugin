import type { ContentScriptContext } from 'wxt/utils/content-script-context'

export class FakeContentScriptContext {
  private readonly invalidationListeners: Array<() => void> = []
  private readonly navigationListeners: Array<(event: { newUrl: URL }) => void> = []

  readonly ctx = {
    addEventListener: (
      _target: unknown,
      _type: string,
      listener: (event: { newUrl: URL }) => void,
    ) => this.navigationListeners.push(listener),
    onInvalidated: (listener: () => void) => this.invalidationListeners.push(listener),
  } as unknown as ContentScriptContext

  navigate(url = 'https://github.com/'): void {
    this.navigationListeners.forEach((listener) => listener({ newUrl: new URL(url) }))
  }

  invalidate(): void {
    this.invalidationListeners.splice(0).forEach((listener) => listener())
    this.navigationListeners.length = 0
  }
}
