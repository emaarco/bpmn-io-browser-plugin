import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DiffDataError } from '../../src/diff/DiffSource'
import { GitlabHost } from '../../src/git-hosts/gitlab/GitlabHost'
import { DIFF_PANEL_TAG } from '../../src/injectedElements'
import { FetchError } from '../../src/messaging/HttpClient'
import { FakeHttpClient } from '../fakes/FakeHttpClient'

const location = {
  hostname: 'gitlab.com',
  origin: 'https://gitlab.com',
  pathname: '/group/project/-/merge_requests/7/diffs',
  search: '',
} as Location

const api = 'https://gitlab.com/api/v4/projects/group%2Fproject/merge_requests/7'
const rawFiles = 'https://gitlab.com/api/v4/projects/group%2Fproject/repository/files'

function withFileBox(path = 'flows/order.bpmn', content = ''): Document {
  document.body.innerHTML = `
    <div class="diff-file" data-path="${path}">
      <div class="diff-content">${content}</div>
    </div>`
  return document
}

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(1_000_000)
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('GitLab merge-request diff', () => {
  it('wires a renamed BPMN file to its old path on the base and its new path on the head', async () => {
    const http = new FakeHttpClient().respondWith({
      [api]: { diff_refs: { base_sha: 'aaa', head_sha: 'bbb' } },
      [`${api}/diffs?per_page=100&page=1`]: [
        { old_path: 'flows/old.bpmn', new_path: 'flows/order.bpmn', renamed_file: true },
      ],
      [`${rawFiles}/flows%2Fold.bpmn/raw?ref=aaa`]: '<old/>',
      [`${rawFiles}/flows%2Forder.bpmn/raw?ref=bbb`]: '<new/>',
    })

    const [block] = await new GitlabHost(http).mergeRequestDiff.collect(location, withFileBox())

    expect(block).toMatchObject({ path: 'flows/order.bpmn', append: 'first' })
    expect(await block!.loadOld()).toBe('<old/>')
    expect(await block!.loadNew()).toBe('<new/>')
  })

  it('ignores files that are not diffable diagrams', async () => {
    const http = new FakeHttpClient()

    const blocks = await new GitlabHost(http).mergeRequestDiff.collect(
      location,
      withFileBox('README.md'),
    )

    expect(blocks).toEqual([])
    expect(http.requests).toEqual([])
  })

  it('surfaces a failed load as a DiffDataError and backs off before retrying', async () => {
    const http = new FakeHttpClient().failEverythingWith(new FetchError('HTTP 401', 401))
    const diff = new GitlabHost(http).mergeRequestDiff
    const doc = withFileBox()

    const err = await diff.collect(location, doc).catch((e: unknown) => e)
    await diff.collect(location, doc).catch(() => undefined)

    expect(err).toBeInstanceOf(DiffDataError)
    expect((err as DiffDataError).files).toHaveLength(1)
    expect(http.requests).toHaveLength(1)
  })

  it('treats a file whose content area only holds our own panel as collapsed', async () => {
    const http = new FakeHttpClient().respondWith({
      [api]: { diff_refs: { base_sha: 'aaa', head_sha: 'bbb' } },
      [`${api}/diffs?per_page=100&page=1`]: [],
    })
    const doc = withFileBox('flows/order.bpmn', `<${DIFF_PANEL_TAG}></${DIFF_PANEL_TAG}>`)

    const [block] = await new GitlabHost(http).mergeRequestDiff.collect(location, doc)

    expect(block!.isCollapsed()).toBe(true)
  })
})
