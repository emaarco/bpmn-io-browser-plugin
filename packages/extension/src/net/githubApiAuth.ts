/**
 * Where the GitHub App token may be sent and when connecting it helps.
 *
 * github.com serves its REST API from the cookie-less `api.github.com` origin,
 * so that is the one host that gets the token. GitLab and GitHub Enterprise keep
 * their API same-origin and cookie-authed: sending a github.com token there would
 * leak it, and connecting the app would not help.
 */

import { apiBase } from '../platforms/githubPrUrls'
import { FetchError } from './client'
import { getGithubToken } from './githubTokenStore'

const GITHUB_API_HOST = 'api.github.com'

export function tokenTargetsGithubApi(url: string): boolean {
  try {
    return new URL(url).host === GITHUB_API_HOST
  } catch {
    return false
  }
}

export async function githubApiAuthHeaders(url: string): Promise<HeadersInit | undefined> {
  if (!tokenTargetsGithubApi(url)) return undefined
  const token = await getGithubToken()
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

export function githubApiErrorHint(location: Location, err: unknown): string {
  const status = err instanceof FetchError ? err.status : undefined
  const tokenCanHelp = tokenTargetsGithubApi(apiBase(location))
  const connectApp = tokenCanHelp
    ? ' Connect the GitHub App in the extension options and install it on this repository (authorise it for the organisation if it uses SSO).'
    : ''
  switch (status) {
    case 401:
      return `Your GitHub connection looks expired or revoked.${tokenCanHelp ? ' Reconnect the GitHub App in the extension options.' : ''}`
    case 403:
      return `GitHub returned 403 — the anonymous rate limit is exhausted, or the app is not authorised for this organisation (SSO).${connectApp}`
    case 404:
      return `This looks like a private repository the page login cannot reach from api.github.com.${connectApp}`
    default:
      return `Could not load the diff metadata${tokenCanHelp ? ' from api.github.com' : ''}.${connectApp}`
  }
}
