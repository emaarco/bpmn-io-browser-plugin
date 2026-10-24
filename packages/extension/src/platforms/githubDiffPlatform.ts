/**
 * Factory shared by the GitHub PR and single-commit diff platforms. Both key the
 * page off a URL-derived `{ key }` info object and reuse the identical DOM scan
 * ({@link ./githubDiffDom}); only `info` (which URLs count) and `load` (which
 * endpoint) vary.
 */

import { createDiffPlatform } from '../diff/createDiffPlatform'
import type { DiffPanelSlot, DiffPlatform } from '../diff/diffPlatform'
import { FetchError } from '../net/client'
import { type FileBox, type GithubDiffData, scanBpmnFileBoxes, toBlock } from './githubDiffDom'

export function createGithubDiffPlatform<Info extends { key: string }>(
  info: (location: Location) => Info | null,
  load: (location: Location, info: Info) => Promise<GithubDiffData>,
): DiffPlatform {
  return createDiffPlatform({
    info,
    scan: scanBpmnFileBoxes,
    slotOf,
    load,
    toBlock,
    errorHint: apiErrorHint,
  })
}

const slotOf = (box: FileBox): DiffPanelSlot => ({
  anchor: box.code,
  append: 'before',
  fileRoot: box.root,
})

/**
 * Turn a metadata-fetch failure into a one-line, actionable hint. The
 * GitHub-App advice only applies to github.com (where the REST API lives on the
 * cookie-less api.github.com origin); GitHub Enterprise is same-origin and
 * cookie-authed, so connecting the app would not help there.
 */
function apiErrorHint(location: Location, err: unknown): string {
  const status = err instanceof FetchError ? err.status : undefined
  const onGithubCom = location.hostname === 'github.com'
  const connectApp = onGithubCom
    ? ' Connect the GitHub App in the extension options and install it on this repository (authorise it for the organisation if it uses SSO).'
    : ''
  switch (status) {
    case 401:
      return `Your GitHub connection looks expired or revoked.${onGithubCom ? ' Reconnect the GitHub App in the extension options.' : ''}`
    case 403:
      return `GitHub returned 403 — the anonymous rate limit is exhausted, or the app is not authorised for this organisation (SSO).${connectApp}`
    case 404:
      return `This looks like a private repository the page login cannot reach from api.github.com.${connectApp}`
    default:
      return `Could not load the diff metadata${onGithubCom ? ' from api.github.com' : ''}.${connectApp}`
  }
}
