import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchJson } from '../src/net/client'
import { loadPrData } from '../src/platforms/githubPr'

vi.mock('../src/net/client', () => ({ fetchJson: vi.fn() }))

const location = { hostname: 'github.com', origin: 'https://github.com' } as Location
const info = { owner: 'o', repo: 'r', number: '1', key: 'o/r!1' }
const api = 'https://api.github.com/repos/o/r'

const pullRequest = {
  base: { sha: 'base-tip', repo: { full_name: 'o/r' } },
  head: { sha: 'head-tip', repo: { full_name: 'fork/r' } },
}

function respondWith(responses: Record<string, unknown>): void {
  vi.mocked(fetchJson).mockImplementation(async (url: string) => {
    if (url in responses) return responses[url]
    throw new Error(`HTTP 404 for ${url}`)
  })
}

beforeEach(() => {
  vi.mocked(fetchJson).mockReset()
})

describe('loadPrData', () => {
  it('diffs against the merge base, not the tip of the base branch', async () => {
    respondWith({
      [`${api}/pulls/1`]: pullRequest,
      [`${api}/compare/base-tip...head-tip?per_page=1`]: {
        merge_base_commit: { sha: 'fork-point' },
      },
      [`${api}/pulls/1/files?per_page=100&page=1`]: [],
    })

    const data = await loadPrData(location, info)

    expect(data.baseSha).toBe('fork-point')
    expect(data.headSha).toBe('head-tip')
  })

  it('falls back to the base branch tip when the merge base cannot be resolved', async () => {
    respondWith({
      [`${api}/pulls/1`]: pullRequest,
      [`${api}/pulls/1/files?per_page=100&page=1`]: [],
    })

    const data = await loadPrData(location, info)

    expect(data.baseSha).toBe('base-tip')
  })
})
