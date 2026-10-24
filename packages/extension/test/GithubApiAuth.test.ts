import { describe, expect, it } from 'vitest'
import { GithubApiAuth } from '../src/git-hosts/github/GithubApiAuth'
import { GithubRoutes } from '../src/git-hosts/github/GithubRoutes'
import { GithubTokenStore } from '../src/git-hosts/github/GithubTokenStore'
import { FetchError } from '../src/messaging/HttpClient'
import { SettingsStore } from '../src/settings/SettingsStore'
import { MemoryStorageArea } from './fakes/MemoryStorageArea'

async function authWithToken(token: string): Promise<GithubApiAuth> {
  const area = new MemoryStorageArea()
  const tokens = new GithubTokenStore(new SettingsStore(() => area))
  await tokens.connect(token, 'octocat')
  return new GithubApiAuth(tokens, new GithubRoutes())
}

const githubCom = { hostname: 'github.com', origin: 'https://github.com' } as Location
const enterprise = { hostname: 'ghe.corp.example', origin: 'https://ghe.corp.example' } as Location

describe('GithubApiAuth.targets (where the token may be sent)', () => {
  it('is true only for the api.github.com host', async () => {
    const auth = await authWithToken('')
    expect(auth.targets('https://api.github.com/repos/o/r/pulls/1')).toBe(true)
    expect(auth.targets('https://github.com/o/r/raw/abc/flows/order.bpmn')).toBe(false)
    expect(auth.targets('https://ghe.corp.example/api/v3/repos/o/r/pulls/1')).toBe(false)
    expect(auth.targets('https://gitlab.com/api/v4/projects/1/merge_requests/2')).toBe(false)
  })

  it('is false for a lookalike host and for a garbage url', async () => {
    const auth = await authWithToken('')
    expect(auth.targets('https://api.github.com.evil.example/repos/o/r')).toBe(false)
    expect(auth.targets('not a url')).toBe(false)
  })
})

describe('GithubApiAuth.headersFor', () => {
  it('sends the stored token to api.github.com only', async () => {
    const auth = await authWithToken('secret')

    expect(await auth.headersFor('https://api.github.com/repos/o/r')).toEqual({
      Authorization: 'Bearer secret',
    })
    expect(await auth.headersFor('https://github.com/o/r/raw/abc/a.bpmn')).toBeUndefined()
  })

  it('sends no header when no token is stored', async () => {
    const auth = await authWithToken('')

    expect(await auth.headersFor('https://api.github.com/repos/o/r')).toBeUndefined()
  })
})

describe('GithubApiAuth.errorHint', () => {
  it('points private github.com repos at the GitHub App', async () => {
    const auth = await authWithToken('')
    const hint = auth.errorHint(githubCom, new FetchError('HTTP 404', 404))
    expect(hint).toMatch(/private repository/i)
    expect(hint).toMatch(/GitHub App/i)
  })

  it('maps 403 to a rate-limit / SSO hint', async () => {
    const auth = await authWithToken('')
    expect(auth.errorHint(githubCom, new FetchError('HTTP 403', 403))).toMatch(/rate limit|SSO/i)
  })

  it('never suggests the GitHub App on Enterprise, where the token cannot help', async () => {
    const auth = await authWithToken('')
    expect(auth.errorHint(enterprise, new FetchError('HTTP 404', 404))).not.toMatch(/GitHub App/)
  })
})
