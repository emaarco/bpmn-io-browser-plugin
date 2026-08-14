import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createGithubDiffPlatform } from '../../src/platforms/githubDiffPlatform'
import { DiffDataError } from '../../src/diff/diffPlatform'
import { FetchError } from '../../src/net/client'
import type { GithubDiffData } from '../../src/platforms/githubDiffDom'

const location = {
  hostname: 'github.com',
  origin: 'https://github.com',
  pathname: '/o/r/pull/1/files',
  search: '',
} as Location

const info = () => ({ key: 'o/r!1' })

function withBpmnFileBox(): Document {
  document.body.innerHTML = `
    <div class="file" data-tagsearch-path="flows/order.bpmn">
      <div class="js-file-content"></div>
    </div>`
  return document
}

const okData: GithubDiffData = {
  baseRepo: 'o/r',
  baseSha: 'aaa',
  headRepo: 'o/r',
  headSha: 'bbb',
  fileByPath: new Map(),
}

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(1_000_000)
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('createGithubDiffPlatform — failure caching (negative cache)', () => {
  it('does not re-fetch on repeated collect while a failure is cooling down', async () => {
    const doc = withBpmnFileBox()
    const load = vi.fn().mockRejectedValue(new FetchError('HTTP 404 for x', 404))
    const platform = createGithubDiffPlatform(info, load)

    await expect(platform.collect(location, doc)).rejects.toBeInstanceOf(DiffDataError)
    await expect(platform.collect(location, doc)).rejects.toBeInstanceOf(DiffDataError)
    await expect(platform.collect(location, doc)).rejects.toBeInstanceOf(DiffDataError)

    // The storm the diff driver would otherwise cause is collapsed to one call.
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('retries once the cooldown has elapsed, and then caches success', async () => {
    const doc = withBpmnFileBox()
    const load = vi
      .fn<() => Promise<GithubDiffData>>()
      .mockRejectedValueOnce(new FetchError('HTTP 404 for x', 404))
      .mockResolvedValue(okData)
    const platform = createGithubDiffPlatform(info, load)

    await expect(platform.collect(location, doc)).rejects.toBeInstanceOf(DiffDataError)
    expect(load).toHaveBeenCalledTimes(1)

    // Still cooling down → no new fetch.
    await expect(platform.collect(location, doc)).rejects.toBeInstanceOf(DiffDataError)
    expect(load).toHaveBeenCalledTimes(1)

    // Past the cooldown → one retry, which now succeeds.
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000 + 61_000)
    const blocks = await platform.collect(location, doc)
    expect(blocks).toHaveLength(1)
    expect(load).toHaveBeenCalledTimes(2)

    // Success is cached: no further fetches.
    await platform.collect(location, doc)
    expect(load).toHaveBeenCalledTimes(2)
  })
})

describe('createGithubDiffPlatform — actionable error', () => {
  it('carries one slot per changed file and a status-specific hint', async () => {
    const doc = withBpmnFileBox()
    const load = vi.fn().mockRejectedValue(new FetchError('HTTP 404 for x', 404))
    const platform = createGithubDiffPlatform(info, load)

    const err = await platform.collect(location, doc).catch((e) => e)
    expect(err).toBeInstanceOf(DiffDataError)
    expect(err.slots).toHaveLength(1)
    expect(err.slots[0].fileRoot).toBeInstanceOf(HTMLElement)
    expect(err.hint).toMatch(/private repository/i)
    expect(err.hint).toMatch(/GitHub App/i)
  })

  it('maps 403 to a rate-limit / SSO hint', async () => {
    const doc = withBpmnFileBox()
    const load = vi.fn().mockRejectedValue(new FetchError('HTTP 403 for x', 403))
    const err = await createGithubDiffPlatform(info, load)
      .collect(location, doc)
      .catch((e) => e)
    expect(err.hint).toMatch(/rate limit|SSO|install/i)
  })
})
