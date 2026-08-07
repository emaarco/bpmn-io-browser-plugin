/**
 * URL heuristics shared by the background worker: deciding whether a page is one
 * the extension can render on (blob `.bpmn` or a GitLab merge request), and
 * converting between an origin and its permission match pattern.
 *
 * These are intentionally content-free — they look only at the URL, so the
 * background can reason about a page it has no host permission for yet (that is
 * what makes the "enable here" hint possible without reading the page).
 */

/** A `.bpmn` blob on either host (GitLab `/-/blob/`, GitHub `/blob/`). */
const BPMN_BLOB = /\/blob\/.*\.bpmn$/i
/** A GitLab merge request (only GitLab has an MR diff view today). */
const GITLAB_MR = /\/-\/merge_requests\//

/** True when the extension has something to render on this URL. */
export function isSupportedUrl(url: string): boolean {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return false
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
  return BPMN_BLOB.test(u.pathname) || GITLAB_MR.test(u.pathname)
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
