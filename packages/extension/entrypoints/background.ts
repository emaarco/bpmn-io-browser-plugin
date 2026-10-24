import { defineBackground } from 'wxt/utils/define-background'
import { browser } from 'wxt/browser'
import addPermissionToggle from 'webext-permission-toggle'
import type { BackgroundRequest, FetchTextResponse } from '../src/net/messages'
import { registerSavedHosts } from '../src/hosts/registration'
import { disableRevokedHosts, enableGrantedHosts } from '../src/hosts/permissions'
import { isSupportedUrl, originToPattern } from '../src/hosts/detect'
import { githubApiAuthHeaders } from '../src/net/githubApiAuth'
import { VIEW_SCRIPTS, type ViewScript } from '../src/inject/viewScripts'

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
  browser.permissions.onAdded.addListener((perms) => void enableGrantedHosts(perms.origins ?? []))
  browser.permissions.onRemoved.addListener(
    (perms) => void disableRevokedHosts(perms.origins ?? []),
  )

  browser.runtime.onMessage.addListener((message: BackgroundRequest, sender, sendResponse) => {
    if (message?.type === 'fetchText') {
      fetchTextForContent(message.url).then(sendResponse)
      return true // keep the message channel open for the async response
    }
    if (message?.type === 'injectViewScript') {
      injectViewScript(sender.tab?.id, message.script).then(sendResponse)
      return true
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

async function injectViewScript(tabId: number | undefined, script: ViewScript): Promise<boolean> {
  if (tabId == null || !VIEW_SCRIPTS.includes(script)) return false
  try {
    await browser.scripting.executeScript({
      target: { tabId },
      files: [`/content-scripts/${script}.js`],
    })
    return true
  } catch (err) {
    console.error(`[bpmn-io-browser-plugin] could not load ${script}`, err)
    return false
  }
}
