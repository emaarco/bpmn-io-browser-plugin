/**
 * GitHub single-commit adapter. Reads the commit's parent (base), its own SHA
 * (head) and the changed-file list from the REST API
 * (`GET /repos/{repo}/commits/{sha}`) and exposes them as {@link GithubDiffData}.
 * Same auth story as the pull-request adapter: public repos work
 * unauthenticated, github.com private repos don't (the REST API can't take the
 * page session), Enterprise `/api/v3` is same-origin.
 *
 * base = first parent's SHA; a root commit (no parents) leaves it empty and every
 * file is `added`, so no old side is fetched. Merge commits diff against their
 * first parent, matching what GitHub renders.
 */

import { fetchJson } from '../net/client'
import type { GithubDiffData, GithubDiffFile } from './githubDiffDom'
import type { CommitInfo } from './githubCommitUrls'
import { apiBase } from './githubPrUrls'

export { commitInfo, type CommitInfo } from './githubCommitUrls'

interface CommitResponse {
  sha: string
  parents: { sha: string }[]
  files?: GithubDiffFile[]
}

export async function loadCommitData(location: Location, info: CommitInfo): Promise<GithubDiffData> {
  const base = apiBase(location)
  const repo = `${info.owner}/${info.repo}`

  const commit = await fetchJson<CommitResponse>(`${base}/repos/${repo}/commits/${info.sha}`)

  const fileByPath = new Map<string, GithubDiffFile>()
  for (const file of commit.files ?? []) {
    fileByPath.set(file.filename, file)
    if (file.previous_filename) fileByPath.set(file.previous_filename, file)
  }

  return {
    baseRepo: repo,
    baseSha: commit.parents[0]?.sha ?? '',
    headRepo: repo,
    headSha: commit.sha,
    fileByPath,
  }
}
