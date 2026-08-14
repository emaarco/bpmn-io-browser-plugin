/**
 * GitHub API token for **private repos on github.com**.
 *
 * github.com serves its REST API from a *different* origin (`api.github.com`),
 * so the page's session cookie is never sent there — private-repo metadata comes
 * back 404, and even public calls share the 60-req/h anonymous rate limit. A
 * user token fixes both (auth + 5000 req/h).
 *
 * The token is a **user-to-server token obtained via the GitHub App device flow**
 * (see {@link ./githubAuth}) — the user installs the app and connects once, and we
 * store the result here. This module owns only the storage + the send guard; how
 * the token is acquired lives in `githubAuth.ts`.
 *
 * The token is attached **only** to `api.github.com`: that is the one host the
 * cookie can't reach. GitLab and GitHub Enterprise keep their API same-origin
 * (`/api/v4`, `/api/v3`), so the cookie already authenticates them — sending a
 * github.com token to a self-hosted host would leak it, so we never do.
 */

import { browser } from 'wxt/browser'

const STORAGE_KEY = 'githubApiToken'

/** github.com login of the connected user, kept only to show "Connected as @…". */
const LOGIN_KEY = 'githubLogin'

/** The one host whose API the page cookie cannot authenticate. */
const GITHUB_API_HOST = 'api.github.com'

/** True when `url` targets github.com's REST API — the only place we send the token. */
export function tokenTargetsGithubApi(url: string): boolean {
  try {
    return new URL(url).host === GITHUB_API_HOST
  } catch {
    return false
  }
}

export async function getGithubToken(): Promise<string> {
  const result = await browser.storage.local.get(STORAGE_KEY)
  const value = result[STORAGE_KEY]
  return typeof value === 'string' ? value.trim() : ''
}

/** Persist (or, for an empty value, clear) the token in extension-local storage. */
export async function setGithubToken(token: string): Promise<void> {
  const trimmed = token.trim()
  if (trimmed) await browser.storage.local.set({ [STORAGE_KEY]: trimmed })
  else await browser.storage.local.remove(STORAGE_KEY)
}

export async function getGithubLogin(): Promise<string> {
  const result = await browser.storage.local.get(LOGIN_KEY)
  const value = result[LOGIN_KEY]
  return typeof value === 'string' ? value : ''
}

/** Persist (or, for an empty value, clear) the connected user's login. */
export async function setGithubLogin(login: string): Promise<void> {
  const trimmed = login.trim()
  if (trimmed) await browser.storage.local.set({ [LOGIN_KEY]: trimmed })
  else await browser.storage.local.remove(LOGIN_KEY)
}
