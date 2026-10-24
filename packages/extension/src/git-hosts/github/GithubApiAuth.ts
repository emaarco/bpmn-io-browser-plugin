import { FetchError } from '../../messaging/HttpClient'
import type { AuthPolicy } from '../GitHost'
import type { GithubRoutes } from './GithubRoutes'
import type { GithubTokenStore } from './GithubTokenStore'

const GITHUB_API_HOST = 'api.github.com'

const CONNECT_APP_HINT =
  ' Connect the GitHub App in the extension options and install it on this repository (authorise it for the organisation if it uses SSO).'
const RECONNECT_APP_HINT = ' Reconnect the GitHub App in the extension options.'

export class GithubApiAuth implements AuthPolicy {
  constructor(
    private readonly tokens: GithubTokenStore,
    private readonly routes: GithubRoutes,
  ) {}

  targets(url: string): boolean {
    try {
      return new URL(url).host === GITHUB_API_HOST
    } catch {
      return false
    }
  }

  async headersFor(url: string): Promise<HeadersInit | undefined> {
    if (!this.targets(url)) return undefined
    const token = await this.tokens.token()
    return token ? { Authorization: `Bearer ${token}` } : undefined
  }

  errorHint(location: Location, err: unknown): string {
    const status = err instanceof FetchError ? err.status : undefined
    const tokenCanHelp = this.targets(this.routes.apiBase(location))
    const connectApp = tokenCanHelp ? CONNECT_APP_HINT : ''
    switch (status) {
      case 401:
        return `Your GitHub connection looks expired or revoked.${tokenCanHelp ? RECONNECT_APP_HINT : ''}`
      case 403:
        return `GitHub returned 403 — the anonymous rate limit is exhausted, or the app is not authorised for this organisation (SSO).${connectApp}`
      case 404:
        return `This looks like a private repository the page login cannot reach from api.github.com.${connectApp}`
      default:
        return `Could not load the diff metadata${tokenCanHelp ? ' from api.github.com' : ''}.${connectApp}`
    }
  }
}
