/**
 * Persisted list of self-hosted GitLab/GitHub instances the user opted into
 * (e.g. `https://gitlab.example.com`, type `gitlab`). Stored in extension-local
 * storage. The origin grant itself lives in the browser's permission store.
 */

import { browser } from 'wxt/browser'

const STORAGE_KEY = 'selfHostedHosts'

export type HostType = 'gitlab' | 'github'

export interface SelfHostedHost {
  origin: string
  /**
   * How the host was added — only used for the options-page badge. Registration
   * is type-agnostic (see registration.ts), so hosts enabled via the one-click
   * toggle have no type and simply show as "self-hosted".
   */
  type?: HostType
}

export async function getSavedHosts(): Promise<SelfHostedHost[]> {
  const result = await browser.storage.local.get(STORAGE_KEY)
  const value = result[STORAGE_KEY]
  return Array.isArray(value) ? (value as SelfHostedHost[]) : []
}

async function saveHosts(hosts: SelfHostedHost[]): Promise<void> {
  const byOrigin = new Map(hosts.map((host) => [host.origin, host]))
  const unique = [...byOrigin.values()].sort((a, b) => a.origin.localeCompare(b.origin))
  await browser.storage.local.set({ [STORAGE_KEY]: unique })
}

export async function addHost(host: SelfHostedHost): Promise<SelfHostedHost[]> {
  const next = [...(await getSavedHosts()).filter((h) => h.origin !== host.origin), host]
  await saveHosts(next)
  return next
}

export async function removeHost(origin: string): Promise<SelfHostedHost[]> {
  const next = (await getSavedHosts()).filter((h) => h.origin !== origin)
  await saveHosts(next)
  return next
}
