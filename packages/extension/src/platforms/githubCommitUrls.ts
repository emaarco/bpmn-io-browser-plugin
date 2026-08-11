/**
 * Pure URL helper for the GitHub single-commit adapter — no network, no DOM — so
 * it can be unit-tested in plain Node. The REST base (`apiBase`) and raw-file
 * route (`rawFileUrl`) are shared with the pull-request adapter; only the page
 * shape differs (`/<owner>/<repo>/commit/<sha>` instead of `.../pull/<n>`).
 */

export interface CommitInfo {
  owner: string
  repo: string
  sha: string
  key: string
}

export function commitInfo(location: Location): CommitInfo | null {
  const match = location.pathname.match(/^\/([^/]+)\/([^/]+)\/commit\/([0-9a-fA-F]{7,64})/)
  if (!match) return null
  const [, owner, repo, sha] = match
  return { owner: owner!, repo: repo!, sha: sha!, key: `${owner}/${repo}@${sha}` }
}
