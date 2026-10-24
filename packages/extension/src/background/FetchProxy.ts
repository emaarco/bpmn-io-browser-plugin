import type { AuthPolicy } from '../git-hosts/GitHost'
import type { FetchTextResponse } from '../messaging/messages'
import { errorMessage } from '../utils/errorMessage'

type Fetch = typeof fetch

export class FetchProxy {
  constructor(
    private readonly authPolicies: readonly AuthPolicy[],
    private readonly fetch: Fetch = (...args) => globalThis.fetch(...args),
  ) {}

  async fetchText(url: string): Promise<FetchTextResponse> {
    try {
      const response = await this.fetch(url, {
        credentials: 'include',
        headers: await this.authHeadersFor(url),
      })
      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status} for ${url}`, status: response.status }
      }
      return { ok: true, text: await response.text() }
    } catch (err) {
      return { ok: false, error: errorMessage(err) }
    }
  }

  private async authHeadersFor(url: string): Promise<HeadersInit | undefined> {
    for (const policy of this.authPolicies) {
      const headers = await policy.headersFor(url)
      if (headers) return headers
    }
    return undefined
  }
}
