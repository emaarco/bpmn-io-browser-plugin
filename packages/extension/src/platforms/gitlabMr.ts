/**
 * GitLab merge-request adapter. Reads the changed files and the base/head SHAs
 * via the GitLab REST API (same-origin, cookie auth through the background
 * worker) and exposes per-file raw URLs.
 *
 * Ported from the "BPMN Diff" userscript (v2.5); origins are made absolute so the
 * same code works on self-hosted instances.
 */

import { fetchJson } from '../net/client'
import type { MrInfo } from './gitlabMrUrls'

export { isBpmnPath, mrInfo, rawFileUrl, type MrInfo } from './gitlabMrUrls'

interface MrChange {
  new_path?: string
  old_path?: string
  new_file?: boolean
  deleted_file?: boolean
  renamed_file?: boolean
}

export interface MrData {
  origin: string
  pid: string
  refs: { base_sha: string; head_sha: string }
  changeByPath: Map<string, MrChange>
}

interface MrResponse {
  diff_refs: { base_sha: string; head_sha: string }
}

const MAX_DIFF_PAGES = 20
const PER_PAGE = 100

export async function loadMrData(location: Location, info: MrInfo): Promise<MrData> {
  const origin = location.origin
  const pid = encodeURIComponent(info.projectPath)

  const mr = await fetchJson<MrResponse>(
    `${origin}/api/v4/projects/${pid}/merge_requests/${info.iid}`,
  )

  const changes: MrChange[] = []
  for (let page = 1; page <= MAX_DIFF_PAGES; page++) {
    const batch = await fetchJson<MrChange[]>(
      `${origin}/api/v4/projects/${pid}/merge_requests/${info.iid}/diffs?per_page=${PER_PAGE}&page=${page}`,
    )
    changes.push(...batch)
    if (batch.length < PER_PAGE) break
  }

  const changeByPath = new Map<string, MrChange>()
  for (const change of changes) {
    if (change.new_path) changeByPath.set(change.new_path, change)
    if (change.old_path) changeByPath.set(change.old_path, change)
  }

  return { origin, pid, refs: mr.diff_refs, changeByPath }
}
