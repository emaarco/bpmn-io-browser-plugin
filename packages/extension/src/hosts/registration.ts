/**
 * Dynamic content-script registration for self-hosted GitLab/GitHub instances.
 *
 * The compiled content scripts already carry their CSS inline (see
 * bundledCss.ts), so registering them for a user-granted origin is enough — no
 * web-accessible resources or per-origin manifest entries required.
 *
 * We register *all* patterns for every granted origin rather than asking the
 * user which flavour their instance is: the GitLab and GitHub blob patterns are
 * made mutually exclusive (the GitHub one excludes GitLab's `/-/` routes), so a
 * host that is actually GitLab never triggers the GitHub script and vice versa.
 * Enabling a domain therefore "just works" whether it is GitLab EE or GitHub
 * Enterprise — no type guess to get wrong.
 */

import { browser } from 'wxt/browser'
import { getSavedHosts, type SelfHostedHost } from './storage'

function scriptsFor(origin: string) {
  return [
    {
      id: `git-diagram-viewer:${origin}:gitlab-blob`,
      matches: [`${origin}/*/-/blob/*`],
      js: ['content-scripts/gitlab-blob.js'],
      runAt: 'document_idle' as const,
    },
    {
      id: `git-diagram-viewer:${origin}:gitlab-mr`,
      matches: [`${origin}/*/-/merge_requests/*`],
      js: ['content-scripts/gitlab-mr.js'],
      runAt: 'document_idle' as const,
    },
    {
      id: `git-diagram-viewer:${origin}:github-blob`,
      matches: [`${origin}/*/blob/*`],
      // GitLab blob URLs (`/group/repo/-/blob/…`) also match `*/blob/*`; exclude
      // every GitLab `/-/` route so this script only fires on real GitHub blobs.
      excludeMatches: [`${origin}/*/-/*`],
      js: ['content-scripts/github-blob.js'],
      runAt: 'document_idle' as const,
    },
    {
      id: `git-diagram-viewer:${origin}:github-pr`,
      matches: [`${origin}/*/pull/*`],
      js: ['content-scripts/github-pr.js'],
      runAt: 'document_idle' as const,
    },
  ]
}

/** Register (or refresh) the content scripts for a single granted host. */
export async function registerHost(host: SelfHostedHost): Promise<void> {
  const scripts = scriptsFor(host.origin)
  const ids = scripts.map((s) => s.id)
  const existing = await browser.scripting.getRegisteredContentScripts({ ids }).catch(() => [])
  if (existing.length) {
    await browser.scripting.unregisterContentScripts({ ids: existing.map((s) => s.id) })
  }
  await browser.scripting.registerContentScripts(scripts)
}

/** Remove the content scripts for a host (called when the user deletes it). */
export async function unregisterHost(host: SelfHostedHost): Promise<void> {
  const ids = scriptsFor(host.origin).map((s) => s.id)
  await browser.scripting.unregisterContentScripts({ ids }).catch(() => undefined)
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
      console.error(`[git-diagram-viewer] could not register ${host.origin}`, err)
    }
  }
}
