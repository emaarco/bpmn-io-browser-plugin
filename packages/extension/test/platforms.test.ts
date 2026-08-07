import { describe, expect, it } from 'vitest'
import { gitlabPlatform } from '../src/platforms/gitlab'
import { githubPlatform } from '../src/platforms/github'
import { isBpmnPath, mrInfo, rawFileUrl } from '../src/platforms/gitlabMrUrls'
import { apiBase, prInfo, rawFileUrl as prRawFileUrl } from '../src/platforms/githubPrUrls'

function loc(pathname: string, origin = 'https://gitlab.com', search = ''): Location {
  return { pathname, origin, search, hostname: new URL(origin).hostname } as Location
}

describe('gitlabPlatform', () => {
  it('recognises blob pages by the blob segment (kind detection is separate)', () => {
    expect(gitlabPlatform.isBlob(loc('/g/p/-/blob/main/order.bpmn'))).toBe(true)
    expect(gitlabPlatform.isBlob(loc('/g/p/-/blob/main/readme.md'))).toBe(true)
    expect(gitlabPlatform.isBlob(loc('/g/p/-/tree/main'))).toBe(false)
  })

  it('derives the raw URL and file path', () => {
    const location = loc('/g/p/-/blob/main/flows/order.bpmn')
    expect(gitlabPlatform.rawUrl(location)).toBe(
      'https://gitlab.com/g/p/-/raw/main/flows/order.bpmn',
    )
    expect(gitlabPlatform.filePath(location)).toBe('flows/order.bpmn')
  })
})

describe('githubPlatform', () => {
  it('recognises blob pages and derives the raw URL', () => {
    const location = loc('/org/repo/blob/main/dir/flow.bpmn', 'https://github.com')
    expect(githubPlatform.isBlob(location)).toBe(true)
    expect(githubPlatform.rawUrl(location)).toBe(
      'https://github.com/org/repo/raw/main/dir/flow.bpmn',
    )
    expect(githubPlatform.filePath(location)).toBe('dir/flow.bpmn')
  })
})

describe('gitlab merge-request urls', () => {
  it('parses project path and iid from an MR url', () => {
    expect(mrInfo(loc('/group/sub/proj/-/merge_requests/42/diffs'))).toEqual({
      projectPath: 'group/sub/proj',
      iid: '42',
      key: 'group/sub/proj!42',
    })
    expect(mrInfo(loc('/group/proj/-/issues/1'))).toBeNull()
  })

  it('builds an encoded raw-file API url', () => {
    expect(rawFileUrl('https://gitlab.com', 'group%2Fproj', 'a/b.bpmn', 'abc123')).toBe(
      'https://gitlab.com/api/v4/projects/group%2Fproj/repository/files/a%2Fb.bpmn/raw?ref=abc123',
    )
  })

  it('detects .bpmn paths case-insensitively', () => {
    expect(isBpmnPath('x/Order.BPMN')).toBe(true)
    expect(isBpmnPath('x/order.bpmnx')).toBe(false)
    expect(isBpmnPath(undefined)).toBe(false)
  })
})

describe('github pull-request urls', () => {
  it('parses owner, repo and number from a PR url', () => {
    expect(prInfo(loc('/org/repo/pull/7/files', 'https://github.com'))).toEqual({
      owner: 'org',
      repo: 'repo',
      number: '7',
      key: 'org/repo!7',
    })
    expect(prInfo(loc('/org/repo/issues/7', 'https://github.com'))).toBeNull()
  })

  it('picks the REST base by host: api.github.com vs Enterprise /api/v3', () => {
    expect(apiBase(loc('/o/r/pull/1', 'https://github.com'))).toBe('https://api.github.com')
    expect(apiBase(loc('/o/r/pull/1', 'https://ghe.corp.example'))).toBe(
      'https://ghe.corp.example/api/v3',
    )
  })

  it('builds a same-origin, per-segment-encoded raw url', () => {
    expect(
      prRawFileUrl(loc('/o/r/pull/1', 'https://github.com'), 'o/r', 'abc123', 'a/b c.bpmn'),
    ).toBe('https://github.com/o/r/raw/abc123/a/b%20c.bpmn')
  })
})
