import { describe, expect, it, vi } from 'vitest'
import { FetchProxy } from '../src/background/FetchProxy'
import type { AuthPolicy } from '../src/git-hosts/GitHost'

const tokenForApi: AuthPolicy = {
  headersFor: async (url) =>
    url.startsWith('https://api.example') ? { Authorization: 'Bearer t' } : undefined,
}

function textResponse(text: string, status = 200): Response {
  return { ok: status < 400, status, text: async () => text } as unknown as Response
}

describe('FetchProxy', () => {
  it('sends cookies and the auth headers of the policy that claims the url', async () => {
    const fetch = vi.fn().mockResolvedValue(textResponse('<xml/>'))

    const response = await new FetchProxy([tokenForApi], fetch).fetchText('https://api.example/x')

    expect(response).toEqual({ ok: true, text: '<xml/>' })
    expect(fetch).toHaveBeenCalledWith('https://api.example/x', {
      credentials: 'include',
      headers: { Authorization: 'Bearer t' },
    })
  })

  it('sends no auth header when no policy claims the url', async () => {
    const fetch = vi.fn().mockResolvedValue(textResponse(''))

    await new FetchProxy([tokenForApi], fetch).fetchText('https://other.example/x')

    expect(fetch.mock.calls[0]![1].headers).toBeUndefined()
  })

  it('reports HTTP failures with their status', async () => {
    const fetch = vi.fn().mockResolvedValue(textResponse('', 404))

    expect(await new FetchProxy([], fetch).fetchText('https://x.example/a')).toEqual({
      ok: false,
      error: 'HTTP 404 for https://x.example/a',
      status: 404,
    })
  })

  it('reports network failures', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('offline'))

    expect(await new FetchProxy([], fetch).fetchText('https://x.example/a')).toEqual({
      ok: false,
      error: 'offline',
    })
  })
})
