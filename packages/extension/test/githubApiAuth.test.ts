import { describe, expect, it, vi } from 'vitest'
import { githubApiAuthHeaders, tokenTargetsGithubApi } from '../src/net/githubApiAuth'
import { getGithubToken } from '../src/net/githubTokenStore'

vi.mock('../src/net/githubTokenStore', () => ({ getGithubToken: vi.fn() }))

describe('tokenTargetsGithubApi (where the token may be sent)', () => {
  it('is true only for the api.github.com host', () => {
    expect(tokenTargetsGithubApi('https://api.github.com/repos/o/r/pulls/1')).toBe(true)
  })

  it('is false for raw content, the web UI and self-hosted API paths', () => {
    // Raw file content is same-origin cookie-authed — never gets the token.
    expect(tokenTargetsGithubApi('https://github.com/o/r/raw/abc/flows/order.bpmn')).toBe(false)
    // GitHub Enterprise keeps its API same-origin; a github.com token must not leak there.
    expect(tokenTargetsGithubApi('https://ghe.corp.example/api/v3/repos/o/r/pulls/1')).toBe(false)
    // GitLab API.
    expect(tokenTargetsGithubApi('https://gitlab.com/api/v4/projects/1/merge_requests/2')).toBe(
      false,
    )
  })

  it('is false for a lookalike host and for a garbage url', () => {
    expect(tokenTargetsGithubApi('https://api.github.com.evil.example/repos/o/r')).toBe(false)
    expect(tokenTargetsGithubApi('not a url')).toBe(false)
  })
})

describe('githubApiAuthHeaders', () => {
  it('sends the stored token to api.github.com only', async () => {
    vi.mocked(getGithubToken).mockResolvedValue('secret')

    expect(await githubApiAuthHeaders('https://api.github.com/repos/o/r')).toEqual({
      Authorization: 'Bearer secret',
    })
    expect(await githubApiAuthHeaders('https://github.com/o/r/raw/abc/a.bpmn')).toBeUndefined()
  })

  it('sends no header when no token is stored', async () => {
    vi.mocked(getGithubToken).mockResolvedValue('')

    expect(await githubApiAuthHeaders('https://api.github.com/repos/o/r')).toBeUndefined()
  })
})
