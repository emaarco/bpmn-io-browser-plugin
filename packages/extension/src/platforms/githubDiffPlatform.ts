/**
 * Factory shared by the GitHub PR and single-commit diff platforms. Both key the
 * page off a URL-derived `{ key }` info object and load their base/head metadata
 * once from a REST endpoint, then reuse the identical DOM scan
 * ({@link ./githubDiffDom}) to place a diagram panel above each changed `.bpmn`
 * file. Only `info` (which URLs count) and `load` (which endpoint) vary.
 */

import { DiffDataError, type DiffPanelSlot, type DiffPlatform } from '../diff/diffPlatform'
import { FetchError } from '../net/client'
import { errorMessage } from '../util/errorMessage'
import { type FileBox, type GithubDiffData, scanBpmnFileBoxes, toBlock } from './githubDiffDom'

interface DiffInfo {
  key: string
}

/**
 * After a failed metadata fetch, keep the failure cached this long before a fresh
 * attempt is allowed. The diff driver re-runs on every debounced DOM mutation, so
 * without this a private-repo 404 or a rate-limit 403 would re-fire the same
 * failing api.github.com calls on every scroll — amplifying the very rate limit
 * that connecting the GitHub App is meant to lift.
 */
const RETRY_FAILED_AFTER_MS = 60_000

export function createGithubDiffPlatform<Info extends DiffInfo>(
  info: (location: Location) => Info | null,
  load: (location: Location, info: Info) => Promise<GithubDiffData>,
): DiffPlatform {
  let cached: { key: string; promise: Promise<GithubDiffData>; failedAt: number | null } | null =
    null

  const ensureData = (location: Location, page: Info): Promise<GithubDiffData> => {
    if (cached?.key === page.key) {
      const cooling =
        cached.failedAt != null && Date.now() - cached.failedAt < RETRY_FAILED_AFTER_MS
      // Reuse a pending/successful load always, and a failed one until it cools down.
      if (cached.failedAt == null || cooling) return cached.promise
    }
    const entry: NonNullable<typeof cached> = {
      key: page.key,
      failedAt: null,
      promise: load(location, page).catch((err) => {
        entry.failedAt = Date.now() // cache the failure so re-runs back off
        throw err
      }),
    }
    cached = entry
    return entry.promise
  }

  return {
    pageKey: (location) => info(location)?.key ?? null,
    async collect(location, doc) {
      const page = info(location)
      if (!page) return []
      const boxes = scanBpmnFileBoxes(doc)
      if (!boxes.length) return []
      let data: GithubDiffData
      try {
        data = await ensureData(location, page)
      } catch (err) {
        throw new DiffDataError(errorMessage(err), apiErrorHint(location, err), boxes.map(slotOf))
      }
      return boxes.map((box) => toBlock(location, box, data))
    },
  }
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
