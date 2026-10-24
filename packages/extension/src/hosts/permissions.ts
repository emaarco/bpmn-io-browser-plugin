/**
 * Reacts to origin grants and revocations (from the right-click toggle, the
 * toolbar icon or the options page): persists the host, registers its view
 * router and reloads its supported tabs — or tears all of that down again.
 */

import { browser } from 'wxt/browser'
import { isSupportedUrl, patternToOrigin } from './detect'
import { registerHost, unregisterHost } from './registration'
import { addHost, getSavedHosts, removeHost } from './storage'

export async function enableGrantedHosts(patterns: string[]): Promise<void> {
  for (const pattern of patterns) {
    const origin = patternToOrigin(pattern)
    if (!origin) continue
    const existing = (await getSavedHosts()).find((h) => h.origin === origin)
    const host = existing ?? { origin }
    await addHost(host)
    try {
      await registerHost(host)
    } catch (err) {
      console.error('[bpmn-io-browser-plugin] register failed for', origin, err)
      continue
    }
    await reloadSupportedTabs(origin)
  }
}

export async function disableRevokedHosts(patterns: string[]): Promise<void> {
  for (const pattern of patterns) {
    const origin = patternToOrigin(pattern)
    if (!origin) continue
    const host = (await getSavedHosts()).find((h) => h.origin === origin) ?? { origin }
    await unregisterHost(host).catch(() => undefined)
    await removeHost(origin)
  }
}

async function reloadSupportedTabs(origin: string): Promise<void> {
  const tabs = await browser.tabs.query({ url: `${origin}/*` }).catch(() => [])
  for (const tab of tabs) {
    if (tab.id != null && tab.url && isSupportedUrl(tab.url)) {
      browser.tabs.reload(tab.id).catch(() => undefined)
    }
  }
}
