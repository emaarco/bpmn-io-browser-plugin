import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DiffDataError } from '../../src/diff/diffPlatform'
import { fetchJson, FetchError } from '../../src/net/client'
import { gitlabDiffPlatform } from '../../src/platforms/gitlabDiff'

vi.mock('../../src/net/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/net/client')>()),
  fetchJson: vi.fn(),
}))

const location = {
  hostname: 'gitlab.com',
  origin: 'https://gitlab.com',
  pathname: '/group/project/-/merge_requests/7/diffs',
  search: '',
} as Location

const api = 'https://gitlab.com/api/v4/projects/group%2Fproject/merge_requests/7'

function withBpmnFileBox(path = 'flows/order.bpmn'): Document {
  document.body.innerHTML = `
    <div class="diff-file" data-path="${path}">
      <div class="diff-content"></div>
    </div>`
  return document
}

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(1_000_000)
  vi.mocked(fetchJson).mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('gitlabDiffPlatform', () => {
  it('wires each changed .bpmn file to its base and head raw URLs', async () => {
    vi.mocked(fetchJson).mockImplementation(async (url: string) => {
      if (url === api) return { diff_refs: { base_sha: 'aaa', head_sha: 'bbb' } }
      if (url === `${api}/diffs?per_page=100&page=1`)
        return [{ old_path: 'flows/old.bpmn', new_path: 'flows/order.bpmn', renamed_file: true }]
      throw new Error(`unexpected ${url}`)
    })

    const blocks = await gitlabDiffPlatform().collect(location, withBpmnFileBox())

    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({ path: 'flows/order.bpmn', append: 'first' })
  })

  it('ignores files that are not BPMN', async () => {
    const blocks = await gitlabDiffPlatform().collect(location, withBpmnFileBox('README.md'))

    expect(blocks).toEqual([])
    expect(fetchJson).not.toHaveBeenCalled()
  })

  it('surfaces a failed load as a DiffDataError and backs off before retrying', async () => {
    vi.mocked(fetchJson).mockRejectedValue(new FetchError('HTTP 401', 401))
    const platform = gitlabDiffPlatform()
    const doc = withBpmnFileBox()

    const err = await platform.collect(location, doc).catch((e: unknown) => e)
    await platform.collect(location, doc).catch(() => undefined)

    expect(err).toBeInstanceOf(DiffDataError)
    expect((err as DiffDataError).slots).toHaveLength(1)
    expect(fetchJson).toHaveBeenCalledTimes(1)
  })
})
