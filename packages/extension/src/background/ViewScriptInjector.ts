import { browser } from 'wxt/browser'

export interface ScriptExecutor {
  executeScript(injection: { target: { tabId: number }; files: string[] }): Promise<unknown>
}

export class ViewScriptInjector {
  constructor(
    private readonly knownScripts: readonly string[],
    private readonly scripting: () => ScriptExecutor = () =>
      browser.scripting as unknown as ScriptExecutor,
  ) {}

  async inject(tabId: number | undefined, script: string): Promise<boolean> {
    if (tabId == null || !this.knownScripts.includes(script)) return false
    try {
      await this.scripting().executeScript({
        target: { tabId },
        files: [`/content-scripts/${script}.js`],
      })
      return true
    } catch (err) {
      console.error(`[bpmn-io-browser-plugin] could not load ${script}`, err)
      return false
    }
  }
}
