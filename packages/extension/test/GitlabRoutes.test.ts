import { describe, expect, it } from 'vitest'
import { GitlabRoutes } from '../src/git-hosts/gitlab/GitlabRoutes'

const routes = new GitlabRoutes()

describe('GitlabRoutes', () => {
  it('parses project path and iid from an MR url', () => {
    expect(routes.mergeRequest({ pathname: '/group/sub/proj/-/merge_requests/42/diffs' })).toEqual({
      projectPath: 'group/sub/proj',
      iid: '42',
      key: 'group/sub/proj!42',
    })
    expect(routes.mergeRequest({ pathname: '/group/proj/-/issues/1' })).toBeNull()
  })

  it('builds an encoded raw-file API url', () => {
    expect(routes.rawFileUrl('https://gitlab.com', 'group/proj', 'a/b.bpmn', 'abc123')).toBe(
      'https://gitlab.com/api/v4/projects/group%2Fproj/repository/files/a%2Fb.bpmn/raw?ref=abc123',
    )
  })
})
