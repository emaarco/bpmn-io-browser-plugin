/**
 * GitLab merge-request adapter. Reads the changed files and the base/head SHAs
 * via the GitLab REST API (same-origin, cookie auth through the background
 * worker) and exposes per-file raw URLs.
 *
 * Ported from the "BPMN Diff" userscript (v2.5); origins are made absolute so the
 * same code works on self-hosted instances.
 */

import { fetchJson } from '../net/client'
import { fetchAllPages } from '../net/fetchAllPages'
import type { MrInfo } from './gitlabMrUrls'

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

export async function loadMrData(location: Location, info: MrInfo): Promise<MrData> {
  const origin = location.origin
  const pid = encodeURIComponent(info.projectPath)

  const mr = await fetchJson<MrResponse>(
    `${origin}/api/v4/projects/${pid}/merge_requests/${info.iid}`,
  )

  const changes = await fetchAllPages<MrChange>(
    `${origin}/api/v4/projects/${pid}/merge_requests/${info.iid}/diffs`,
  )

  const changeByPath = new Map<string, MrChange>()
  for (const change of changes) {
    if (change.new_path) changeByPath.set(change.new_path, change)
    if (change.old_path) changeByPath.set(change.old_path, change)
  }

  return { origin, pid, refs: mr.diff_refs, changeByPath }
}
