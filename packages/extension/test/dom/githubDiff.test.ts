import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DiffDataError } from '../../src/diff/DiffSource'
import { GithubHost } from '../../src/git-hosts/github/GithubHost'
import { GithubTokenStore } from '../../src/git-hosts/github/GithubTokenStore'
import { FetchError } from '../../src/messaging/HttpClient'
import { SettingsStore } from '../../src/settings/SettingsStore'
import { FakeHttpClient } from '../fakes/FakeHttpClient'
import { MemoryStorageArea } from '../fakes/MemoryStorageArea'

const location = {
  hostname: 'github.com',
  origin: 'https://github.com',
  pathname: '/o/r/pull/1/files',
  search: '',
} as Location

const api = 'https://api.github.com/repos/o/r'

const pullRequestMetadata = {
  [`${api}/pulls/1`]: {
    base: { sha: 'aaa', repo: { full_name: 'o/r' } },
    head: { sha: 'bbb', repo: { full_name: 'o/r' } },
  },
  [`${api}/compare/aaa...bbb?per_page=1`]: { merge_base_commit: { sha: 'aaa' } },
  [`${api}/pulls/1/files?per_page=100&page=1`]: [
    { filename: 'flows/order.bpmn', status: 'modified' },
  ],
}

function pullRequestDiff(http: FakeHttpClient) {
  const tokens = new GithubTokenStore(new SettingsStore(() => new MemoryStorageArea()))
  return new GithubHost(http, tokens).pullRequestDiff
}

function withFileBoxes(html: string): Document {
  document.body.innerHTML = html
  return document
}

const legacyBpmnBox = `
  <div class="file" data-tagsearch-path="flows/order.bpmn">
    <div class="js-file-content"></div>
  </div>`

const metadataRequests = (http: FakeHttpClient) =>
  http.requests.filter((url) => url === `${api}/pulls/1`).length

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(1_000_000)
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('GitHub pull-request diff', () => {
  it('wires each changed BPMN file to its base and head raw files', async () => {
    const http = new FakeHttpClient().respondWith({
      ...pullRequestMetadata,
      'https://github.com/o/r/raw/aaa/flows/order.bpmn': '<old/>',
      'https://github.com/o/r/raw/bbb/flows/order.bpmn': '<new/>',
    })

    const [block] = await pullRequestDiff(http).collect(location, withFileBoxes(legacyBpmnBox))

    expect(block).toMatchObject({ path: 'flows/order.bpmn', append: 'before' })
    expect(await block!.loadOld()).toBe('<old/>')
    expect(await block!.loadNew()).toBe('<new/>')
  })

  it('reads the head-side path from the React header, without bidi marks', async () => {
    const http = new FakeHttpClient().respondWith(pullRequestMetadata)
    const doc = withFileBoxes(`
      <div id="diff-1" aria-labelledby="heading-1">
        <div data-diff-header-wrapper><h3 id="heading-1">‎flows/old.bpmn → flows/⁦order⁩.bpmn</h3></div>
        <div><table data-diff-anchor></table></div>
      </div>`)

    const blocks = await pullRequestDiff(http).collect(location, doc)

    expect(blocks.map((block) => block.path)).toEqual(['flows/order.bpmn'])
  })

  it('skips kinds without diff support and fetches nothing for them', async () => {
    const http = new FakeHttpClient().respondWith(pullRequestMetadata)
    const doc = withFileBoxes(`
      <div class="file" data-tagsearch-path="rules/decide.dmn">
        <div class="js-file-content"></div>
      </div>`)

    expect(await pullRequestDiff(http).collect(location, doc)).toEqual([])
    expect(http.requests).toEqual([])
  })
})

describe('GitHub pull-request diff — failed metadata', () => {
  it('does not re-fetch while a failure is cooling down', async () => {
    const http = new FakeHttpClient().failEverythingWith(new FetchError('HTTP 404 for x', 404))
    const diff = pullRequestDiff(http)
    const doc = withFileBoxes(legacyBpmnBox)

    for (let attempt = 0; attempt < 3; attempt++) {
      await expect(diff.collect(location, doc)).rejects.toBeInstanceOf(DiffDataError)
    }

    expect(metadataRequests(http)).toBe(1)
  })

  it('retries once the cooldown has elapsed, and then caches success', async () => {
    const http = new FakeHttpClient().failEverythingWith(new FetchError('HTTP 404 for x', 404))
    const diff = pullRequestDiff(http)
    const doc = withFileBoxes(legacyBpmnBox)
    await expect(diff.collect(location, doc)).rejects.toBeInstanceOf(DiffDataError)

    http.respondWith(pullRequestMetadata)
    await expect(diff.collect(location, doc)).rejects.toBeInstanceOf(DiffDataError)
    expect(metadataRequests(http)).toBe(1)

    vi.spyOn(Date, 'now').mockReturnValue(1_000_000 + 61_000)
    expect(await diff.collect(location, doc)).toHaveLength(1)
    await diff.collect(location, doc)
    expect(metadataRequests(http)).toBe(2)
  })

  it('carries every changed file and a status-specific hint', async () => {
    const http = new FakeHttpClient().failEverythingWith(new FetchError('HTTP 404 for x', 404))

    const err = await pullRequestDiff(http)
      .collect(location, withFileBoxes(legacyBpmnBox))
      .then(
        () => expect.unreachable(),
        (e: DiffDataError) => e,
      )

    expect(err).toBeInstanceOf(DiffDataError)
    expect(err.files.map((file) => file.path)).toEqual(['flows/order.bpmn'])
    expect(err.hint).toMatch(/private repository/i)
  })
})
