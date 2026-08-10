/**
 * GitHub pull-request adapter. Reads the base/head SHAs and the changed-file list
 * from the GitHub REST API (api.github.com, or `/api/v3` on Enterprise) and
 * exposes per-file raw URLs. Public repos work unauthenticated; github.com
 * private repos need auth the REST API can't take from the page session (same
 * limit as the blob viewer), while Enterprise `/api/v3` is same-origin and uses
 * the session cookie.
 */

import { fetchJson } from '../net/client'
import { apiBase, type PrInfo } from './githubPrUrls'

export { isBpmnPath, normalizeDiffPath, prInfo, rawFileUrl, type PrInfo } from './githubPrUrls'

interface PrFile {
  filename: string
  previous_filename?: string
  /** added | removed | modified | renamed | copied | changed | unchanged */
  status: string
}

export interface PrData {
  baseRepo: string
  baseSha: string
  headRepo: string
  headSha: string
  fileByPath: Map<string, PrFile>
}

interface PrResponse {
  base: { sha: string; repo: { full_name: string } | null }
  head: { sha: string; repo: { full_name: string } | null }
}

const MAX_FILE_PAGES = 20
const PER_PAGE = 100

export async function loadPrData(location: Location, info: PrInfo): Promise<PrData> {
  const base = apiBase(location)
  const repo = `${info.owner}/${info.repo}`

  const pr = await fetchJson<PrResponse>(`${base}/repos/${repo}/pulls/${info.number}`)

  const files: PrFile[] = []
  for (let page = 1; page <= MAX_FILE_PAGES; page++) {
    const batch = await fetchJson<PrFile[]>(
      `${base}/repos/${repo}/pulls/${info.number}/files?per_page=${PER_PAGE}&page=${page}`,
    )
    files.push(...batch)
    if (batch.length < PER_PAGE) break
  }

  const fileByPath = new Map<string, PrFile>()
  for (const file of files) {
    fileByPath.set(file.filename, file)
    if (file.previous_filename) fileByPath.set(file.previous_filename, file)
  }

  return {
    baseRepo: pr.base.repo?.full_name ?? repo,
    baseSha: pr.base.sha,
    headRepo: pr.head.repo?.full_name ?? repo,
    headSha: pr.head.sha,
    fileByPath,
  }
}
