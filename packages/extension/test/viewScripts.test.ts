import { describe, expect, it } from 'vitest'
import { viewScriptsFor } from '../src/inject/viewScripts'

const scriptsAt = (url: string) => viewScriptsFor(new URL(url))

describe('viewScriptsFor', () => {
  it('loads the GitHub blob viewer for diagram files only', () => {
    expect(scriptsAt('https://github.com/o/r/blob/main/flows/order.bpmn')).toEqual(['github-blob'])
    expect(scriptsAt('https://github.com/o/r/blob/main/rules.DMN')).toEqual(['github-blob'])
    expect(scriptsAt('https://github.com/o/r/blob/main/README.md')).toEqual([])
  })

  it('loads the GitHub diff scripts on pull requests and commits', () => {
    expect(scriptsAt('https://github.com/o/r/pull/12')).toEqual(['github-pr'])
    expect(scriptsAt('https://github.com/o/r/pull/12/files')).toEqual(['github-pr'])
    expect(scriptsAt('https://github.com/o/r/commit/c0ffee0')).toEqual(['github-commit'])
  })

  it('loads nothing on GitHub pages without a diagram view', () => {
    expect(scriptsAt('https://github.com/o/r')).toEqual([])
    expect(scriptsAt('https://github.com/o/r/tree/main/flows')).toEqual([])
    expect(scriptsAt('https://github.com/o/r/pulls')).toEqual([])
    expect(scriptsAt('https://github.com/o/r/commits/main')).toEqual([])
  })

  it('renders github.com files below a directory named "-"', () => {
    expect(scriptsAt('https://github.com/o/r/blob/main/-/order.bpmn')).toEqual(['github-blob'])
  })

  it('loads the GitLab scripts on gitlab.com', () => {
    expect(scriptsAt('https://gitlab.com/g/p/-/blob/main/order.bpmn')).toEqual(['gitlab-blob'])
    expect(scriptsAt('https://gitlab.com/g/sub/p/-/merge_requests/42/diffs')).toEqual(['gitlab-mr'])
    expect(scriptsAt('https://gitlab.com/g/p/-/blob/main/README.md')).toEqual([])
    expect(scriptsAt('https://gitlab.com/g/p/-/tree/main')).toEqual([])
    expect(scriptsAt('https://gitlab.com/g/p')).toEqual([])
  })

  it('never mixes the flavours on the public hosts', () => {
    expect(scriptsAt('https://gitlab.com/g/p/-/blob/main/pull/1/order.bpmn')).toEqual([
      'gitlab-blob',
    ])
    expect(scriptsAt('https://github.com/o/r/pull/1/-/merge_requests/2')).toEqual(['github-pr'])
  })

  it('tells the flavour of a self-hosted instance from its route shape', () => {
    expect(scriptsAt('https://git.example.com/g/p/-/blob/main/order.bpmn')).toEqual(['gitlab-blob'])
    expect(scriptsAt('https://git.example.com/g/p/-/merge_requests/3')).toEqual(['gitlab-mr'])
    expect(scriptsAt('https://git.example.com/g/p/-/tree/main')).toEqual([])
    expect(scriptsAt('https://ghe.example.com/o/r/blob/main/order.bpmn')).toEqual(['github-blob'])
    expect(scriptsAt('https://ghe.example.com/o/r/pull/3/files')).toEqual(['github-pr'])
    expect(scriptsAt('https://ghe.example.com/o/r/commit/c0ffee0')).toEqual(['github-commit'])
    expect(scriptsAt('http://localhost:4599/octo/flows')).toEqual([])
  })
})
