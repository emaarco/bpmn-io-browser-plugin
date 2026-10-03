/**
 * Dynamic content-script registration for self-hosted GitLab/GitHub instances.
 *
 * A granted origin only gets the view router registered, for all of its pages.
 * The router decides per URL which view script applies — telling GitLab from
 * GitHub by the route shape, so the user never has to say which flavour their
 * instance is — and has the background worker load it on demand.
 */

import { browser } from 'wxt/browser'
import { VIEW_SCRIPTS } from '../inject/viewScripts'
import { getSavedHosts, type SelfHostedHost } from './storage'

const VIEW_ROUTER = 'view-router'
const scriptsRegisteredByEarlierVersions = VIEW_SCRIPTS

const scriptId = (origin: string, script: string) => `bpmn-io-browser-plugin:${origin}:${script}`

function viewRouterFor(origin: string) {
  return {
    id: scriptId(origin, VIEW_ROUTER),
    matches: [`${origin}/*`],
    js: [`content-scripts/${VIEW_ROUTER}.js`],
    runAt: 'document_idle' as const,
  }
}

async function registeredScriptIds(origin: string): Promise<string[]> {
  const ids = [VIEW_ROUTER, ...scriptsRegisteredByEarlierVersions].map((script) =>
    scriptId(origin, script),
  )
  const registered = await browser.scripting.getRegisteredContentScripts({ ids }).catch(() => [])
  return registered.map((script) => script.id)
}

/** Register (or refresh) the view router for a single granted host. */
export async function registerHost(host: SelfHostedHost): Promise<void> {
  const ids = await registeredScriptIds(host.origin)
  if (ids.length) await browser.scripting.unregisterContentScripts({ ids })
  await browser.scripting.registerContentScripts([viewRouterFor(host.origin)])
}

/** Remove the content scripts for a host (called when the user deletes it). */
export async function unregisterHost(host: SelfHostedHost): Promise<void> {
  const ids = await registeredScriptIds(host.origin)
  if (ids.length) await browser.scripting.unregisterContentScripts({ ids }).catch(() => undefined)
}

/**
 * Re-register every saved host whose origin permission is still granted. Called
 * from the background worker on startup.
 */
export async function registerSavedHosts(): Promise<void> {
  const hosts = await getSavedHosts()
  for (const host of hosts) {
    const granted = await browser.permissions.contains({ origins: [`${host.origin}/*`] })
    if (!granted) continue
    try {
      await registerHost(host)
    } catch (err) {
      console.error(`[bpmn-io-browser-plugin] could not register ${host.origin}`, err)
    }
  }
}
