import { browser } from 'wxt/browser'
import type { ContentScriptContext } from 'wxt/utils/content-script-context'
import type { InjectViewScriptRequest } from '../net/messages'
import { viewScriptsFor, type PageUrl, type ViewScript } from './viewScripts'

export function runViewRouter(ctx: ContentScriptContext): void {
  const requestedScripts = new Set<ViewScript>()

  const load = async (script: ViewScript): Promise<void> => {
    requestedScripts.add(script)
    const request: InjectViewScriptRequest = { type: 'injectViewScript', script }
    const loaded = await browser.runtime.sendMessage(request).catch(() => false)
    if (!loaded) requestedScripts.delete(script)
  }

  const loadMissingViewScripts = (url: PageUrl): void => {
    for (const script of viewScriptsFor(url)) {
      if (!requestedScripts.has(script)) void load(script)
    }
  }

  ctx.addEventListener(window, 'wxt:locationchange', (event) =>
    loadMissingViewScripts(event.newUrl),
  )
  loadMissingViewScripts(location)
}
