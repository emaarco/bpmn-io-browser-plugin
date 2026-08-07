import { describe, expect, it } from 'vitest'
import { isSupportedUrl, originToPattern, patternToOrigin } from '../src/hosts/detect'

describe('isSupportedUrl', () => {
  it('matches .bpmn blobs on GitLab and GitHub (incl. self-hosted)', () => {
    expect(isSupportedUrl('https://gitlab.com/group/repo/-/blob/main/flow.bpmn')).toBe(true)
    expect(isSupportedUrl('https://github.com/org/repo/blob/main/flow.bpmn')).toBe(true)
    expect(isSupportedUrl('https://gitlab.dm-drogeriemarkt.com/x/y/-/blob/main/a.bpmn')).toBe(true)
    // Query and hash after the path must not defeat the match.
    expect(isSupportedUrl('https://github.com/o/r/blob/main/a.bpmn?plain=1')).toBe(true)
  })

  it('matches GitLab merge requests', () => {
    expect(isSupportedUrl('https://gitlab.example.com/g/r/-/merge_requests/42/diffs')).toBe(true)
  })

  it('rejects non-.bpmn files, unrelated pages and non-http schemes', () => {
    expect(isSupportedUrl('https://github.com/org/repo/blob/main/README.md')).toBe(false)
    expect(isSupportedUrl('https://gitlab.com/group/repo')).toBe(false)
    expect(isSupportedUrl('chrome-extension://abc/options.html')).toBe(false)
    expect(isSupportedUrl('not a url')).toBe(false)
  })
})

describe('origin <-> pattern', () => {
  it('round-trips a concrete origin', () => {
    const pattern = originToPattern('https://gitlab.example.com')
    expect(pattern).toBe('https://gitlab.example.com/*')
    expect(patternToOrigin(pattern)).toBe('https://gitlab.example.com')
  })

  it('keeps an explicit port', () => {
    expect(patternToOrigin('http://localhost:8080/*')).toBe('http://localhost:8080')
  })

  it('returns null for wildcard / non-origin patterns', () => {
    expect(patternToOrigin('<all_urls>')).toBeNull()
    expect(patternToOrigin('*://*/*')).toBeNull()
  })
})
