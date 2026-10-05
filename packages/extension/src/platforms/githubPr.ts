/**
 * GitHub pull-request adapter. Reads the base/head SHAs and the changed-file list
 * from the GitHub REST API (api.github.com, or `/api/v3` on Enterprise) and
 * exposes them as {@link GithubDiffData}. Public repos work unauthenticated;
 * github.com private repos need auth the REST API can't take from the page
 * session (same limit as the blob viewer), while Enterprise `/api/v3` is
 * same-origin and uses the session cookie.
 *
 * base = the merge base of the two branches, which is what GitHub's own "Files
 * changed" diffs against. `base.sha` is the tip of the target branch, so using it
 * would show everything merged there since the fork point as reverted.
 */

import { fetchJson } from '../net/client'
import type { GithubDiffData, GithubDiffFile } from './githubDiffDom'
import { apiBase, type PrInfo } from './githubPrUrls'

interface PrResponse {
  base: { sha: string; repo: { full_name: string } | null }
  head: { sha: string; repo: { full_name: string } | null }
}

interface CompareResponse {
  merge_base_commit: { sha: string }
}

const MAX_FILE_PAGES = 20
const PER_PAGE = 100

export async function loadPrData(location: Location, info: PrInfo): Promise<GithubDiffData> {
  const base = apiBase(location)
  const repo = `${info.owner}/${info.repo}`

  const pr = await fetchJson<PrResponse>(`${base}/repos/${repo}/pulls/${info.number}`)

  const files: GithubDiffFile[] = []
  for (let page = 1; page <= MAX_FILE_PAGES; page++) {
    const batch = await fetchJson<GithubDiffFile[]>(
      `${base}/repos/${repo}/pulls/${info.number}/files?per_page=${PER_PAGE}&page=${page}`,
    )
    files.push(...batch)
    if (batch.length < PER_PAGE) break
  }

  const fileByPath = new Map<string, GithubDiffFile>()
  for (const file of files) {
    fileByPath.set(file.filename, file)
    if (file.previous_filename) fileByPath.set(file.previous_filename, file)
  }

  return {
    baseRepo: pr.base.repo?.full_name ?? repo,
    baseSha: await mergeBaseSha(`${base}/repos/${repo}`, pr),
    headRepo: pr.head.repo?.full_name ?? repo,
    headSha: pr.head.sha,
    fileByPath,
  }
}

async function mergeBaseSha(repoApi: string, pr: PrResponse): Promise<string> {
  try {
    const comparison = await fetchJson<CompareResponse>(
      `${repoApi}/compare/${pr.base.sha}...${pr.head.sha}?per_page=1`,
    )
    return comparison.merge_base_commit.sha
  } catch {
    return pr.base.sha
  }
}
