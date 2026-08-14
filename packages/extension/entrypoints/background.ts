import { defineBackground } from 'wxt/utils/define-background'
import { browser } from 'wxt/browser'
import addPermissionToggle from 'webext-permission-toggle'
import type { BackgroundRequest, FetchTextResponse } from '../src/net/messages'
import { registerHost, registerSavedHosts, unregisterHost } from '../src/hosts/registration'
import { addHost, getSavedHosts, removeHost } from '../src/hosts/storage'
import { isSupportedUrl, originToPattern, patternToOrigin } from '../src/hosts/detect'
import { getGithubToken, tokenTargetsGithubApi } from '../src/net/githubTokenStore'

export default defineBackground(() => {
  // Re-register content scripts for user-added self-hosted instances on startup.
  registerSavedHosts().catch((err) =>
    console.error('[bpmn-io-browser-plugin] host registration failed', err),
  )

  // Right-click "Enable bpmn-io-browser-plugin on this domain" on any page — the browser
  // handles the grant; we react to permissions.onAdded below. Cross-browser.
  addPermissionToggle({ title: 'Enable bpmn-io-browser-plugin on this domain' })

  // Left-click the toolbar icon on a supported page → one-click enable for that
  // origin; anywhere else it opens the options page. The icon stays clickable
  // everywhere (a page-conditional icon via declarativeContent proved
  // unreliable in MV3 — action.disable()+ShowAction left it greyed even on
  // matching tabs), so the click is made context-aware instead.
  browser.action?.onClicked.addListener((tab) => void onActionClick(tab))

  // A granted/revoked origin (from the toggle, the icon, or the options page)
  // drives the actual content-script registration + persistence.
  browser.permissions.onAdded.addListener((perms) => void onGranted(perms.origins ?? []))
  browser.permissions.onRemoved.addListener((perms) => void onRevoked(perms.origins ?? []))

  browser.runtime.onMessage.addListener((message: BackgroundRequest, _sender, sendResponse) => {
    if (message?.type === 'fetchText') {
      fetchTextForContent(message.url).then(sendResponse)
      return true // keep the message channel open for the async response
    }
    return false
  })
})

/** Toolbar-icon click: request access to just this origin, or open options. */
async function onActionClick(tab: { id?: number; url?: string }): Promise<void> {
  if (!tab.url || !isSupportedUrl(tab.url)) {
    await browser.runtime.openOptionsPage().catch(() => undefined)
    return
  }
  const origin = new URL(tab.url).origin
  // Resolves true immediately if already granted; onAdded then does the rest.
  await browser.permissions.request({ origins: [originToPattern(origin)] }).catch(() => false)
}

/** A newly granted origin: persist it, register its scripts, reload its tabs. */
async function onGranted(patterns: string[]): Promise<void> {
  for (const pattern of patterns) {
    const origin = patternToOrigin(pattern)
    if (!origin) continue // e.g. `<all_urls>` — not a concrete self-hosted origin
    const existing = (await getSavedHosts()).find((h) => h.origin === origin)
    const host = existing ?? { origin }
    await addHost(host)
    try {
      await registerHost(host)
    } catch (err) {
      console.error('[bpmn-io-browser-plugin] register failed for', origin, err)
      continue
    }
    const tabs = await browser.tabs.query({ url: `${origin}/*` }).catch(() => [])
    for (const tab of tabs) {
      // Only reload tabs that will actually render — no need to disturb others.
      if (tab.id != null && tab.url && isSupportedUrl(tab.url)) {
        browser.tabs.reload(tab.id).catch(() => undefined)
      }
    }
  }
}

/** A revoked origin (toggle turned off / removed in options): tear it down. */
async function onRevoked(patterns: string[]): Promise<void> {
  for (const pattern of patterns) {
    const origin = patternToOrigin(pattern)
    if (!origin) continue
    const host = (await getSavedHosts()).find((h) => h.origin === origin) ?? { origin }
    await unregisterHost(host).catch(() => undefined)
    await removeHost(origin)
  }
}

async function fetchTextForContent(url: string): Promise<FetchTextResponse> {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: await githubApiAuthHeaders(url),
    })
    if (!response.ok)
      return { ok: false, error: `HTTP ${response.status} for ${url}`, status: response.status }
    return { ok: true, text: await response.text() }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Authorization header for a request, but only for github.com's REST API — the
 * one host the page cookie can't reach (see {@link githubTokenStore}). Everything else
 * (raw content, GitLab, GitHub Enterprise) is same-origin and cookie-authed, and
 * must never receive the token.
 */
async function githubApiAuthHeaders(url: string): Promise<HeadersInit | undefined> {
  if (!tokenTargetsGithubApi(url)) return undefined
  const token = await getGithubToken()
  return token ? { Authorization: `Bearer ${token}` } : undefined
}
