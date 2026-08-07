/**
 * Pure URL/path helpers for the GitHub pull-request adapter — no network, no DOM
 * — so they can be unit-tested in plain Node. Handles both github.com (REST at
 * api.github.com) and GitHub Enterprise (same-origin `/api/v3`). Raw content uses
 * the same-origin `/<repo>/raw/<ref>/<path>` route the blob viewer uses, so it is
 * cookie-authenticated (private repos work on Enterprise / a logged-in session).
 */

export interface PrInfo {
  owner: string
  repo: string
  number: string
  key: string
}

export function prInfo(location: Location): PrInfo | null {
  const match = location.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
  if (!match) return null
  const [, owner, repo, number] = match
  return { owner: owner!, repo: repo!, number: number!, key: `${owner}/${repo}!${number}` }
}

/** REST API base for this host: api.github.com for github.com, else `/api/v3`. */
export function apiBase(location: Location): string {
  return location.hostname === 'github.com' ? 'https://api.github.com' : `${location.origin}/api/v3`
}

/** Raw file URL for `<repo>` (`owner/name`) at `ref`, on the current host. */
export function rawFileUrl(
  location: Location,
  repoFullName: string,
  ref: string,
  path: string,
): string {
  const encPath = path.split('/').map(encodeURIComponent).join('/')
  return `${location.origin}/${repoFullName}/raw/${encodeURIComponent(ref)}/${encPath}`
}

/** True for a path that names a `.bpmn` file. */
export function isBpmnPath(path: string | undefined | null): boolean {
  return !!path && /\.bpmn$/i.test(path)
}

/**
 * Clean a path read from the React diff header: strip the invisible bidi marks
 * GitHub wraps it in (they break equality against the REST API path), and for a
 * renamed `old → new` header keep the head-side path.
 */
export function normalizeDiffPath(text: string): string {
  const clean = text.replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu, '').trim()
  return (clean.split('→').pop() ?? clean).trim()
}
