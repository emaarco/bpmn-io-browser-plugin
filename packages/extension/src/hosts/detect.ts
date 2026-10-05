/**
 * URL heuristics shared by the background worker: deciding whether a page is one
 * the extension can render on (any page a view script exists for), and
 * converting between an origin and its permission match pattern.
 *
 * These are intentionally content-free — they look only at the URL, so the
 * background can reason about a page it has no host permission for yet (that is
 * what makes the "enable here" hint possible without reading the page).
 */

import { viewScriptsFor } from '../inject/viewScripts'

/** True when the extension has something to render on this URL. */
export function isSupportedUrl(url: string): boolean {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return false
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
  return viewScriptsFor(u).length > 0
}

/** `https://gitlab.example.com` -> `https://gitlab.example.com/*` */
export function originToPattern(origin: string): string {
  return `${origin}/*`
}

/** `https://gitlab.example.com/*` -> `https://gitlab.example.com` (null if not a concrete origin). */
export function patternToOrigin(pattern: string): string | null {
  const match = /^(https?:\/\/[^/]+)\/\*$/.exec(pattern)
  return match?.[1] ?? null
}
