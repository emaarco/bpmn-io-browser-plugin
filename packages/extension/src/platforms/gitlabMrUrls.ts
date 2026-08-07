/**
 * Pure URL/path helpers for the GitLab merge-request adapter — no network, no
 * DOM — so they can be unit-tested in plain Node.
 */

export interface MrInfo {
  projectPath: string
  iid: string
  key: string
}

export function mrInfo(location: Location): MrInfo | null {
  const match = location.pathname.match(/^\/(.+?)\/-\/merge_requests\/(\d+)/)
  if (!match) return null
  const [, projectPath, iid] = match
  return { projectPath: projectPath!, iid: iid!, key: `${projectPath}!${iid}` }
}

export function rawFileUrl(origin: string, pid: string, path: string, ref: string): string {
  return `${origin}/api/v4/projects/${pid}/repository/files/${encodeURIComponent(path)}/raw?ref=${encodeURIComponent(ref)}`
}

/** True for a path that names a `.bpmn` file. */
export function isBpmnPath(path: string | undefined | null): boolean {
  return !!path && /\.bpmn$/i.test(path)
}
