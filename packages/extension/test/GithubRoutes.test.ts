import { describe, expect, it } from 'vitest'
import { GithubRoutes } from '../src/git-hosts/github/GithubRoutes'

const routes = new GithubRoutes()

function loc(pathname: string, origin = 'https://github.com'): Location {
  return { pathname, origin, hostname: new URL(origin).hostname } as Location
}

describe('GithubRoutes.pullRequest', () => {
  it('parses owner, repo and number from a PR url', () => {
    expect(routes.pullRequest(loc('/org/repo/pull/7/files'))).toEqual({
      owner: 'org',
      repo: 'repo',
      number: '7',
      key: 'org/repo!7',
    })
    expect(routes.pullRequest(loc('/org/repo/issues/7'))).toBeNull()
  })
})

describe('GithubRoutes.commit', () => {
  it('parses owner, repo and sha from a commit url', () => {
    expect(routes.commit(loc('/org/repo/commit/54d93c90a9c6bacb040e1f5cb608fb9cffb263ab'))).toEqual(
      {
        owner: 'org',
        repo: 'repo',
        sha: '54d93c90a9c6bacb040e1f5cb608fb9cffb263ab',
        key: 'org/repo@54d93c90a9c6bacb040e1f5cb608fb9cffb263ab',
      },
    )
  })

  it('accepts a short sha and ignores trailing path/query', () => {
    expect(routes.commit(loc('/org/repo/commit/54d93c9/checks'))?.sha).toBe('54d93c9')
  })

  it('rejects non-commit and non-hex paths', () => {
    expect(routes.commit(loc('/org/repo/commits/main'))).toBeNull()
    expect(routes.commit(loc('/org/repo/commit/not-a-sha'))).toBeNull()
    expect(routes.commit(loc('/org/repo/pull/7/files'))).toBeNull()
  })
})

describe('GithubRoutes urls', () => {
  it('picks the REST base by host: api.github.com vs Enterprise /api/v3', () => {
    expect(routes.apiBase(loc('/o/r/pull/1'))).toBe('https://api.github.com')
    expect(routes.apiBase(loc('/o/r/pull/1', 'https://ghe.corp.example'))).toBe(
      'https://ghe.corp.example/api/v3',
    )
  })

  it('builds a same-origin, per-segment-encoded raw url', () => {
    expect(routes.rawFileUrl(loc('/o/r/pull/1'), 'o/r', 'abc123', 'a/b c.bpmn')).toBe(
      'https://github.com/o/r/raw/abc123/a/b%20c.bpmn',
    )
  })
})
