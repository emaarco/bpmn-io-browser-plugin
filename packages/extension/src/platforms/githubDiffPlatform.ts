/**
 * Factory shared by the GitHub PR and single-commit diff platforms. Both key the
 * page off a URL-derived `{ key }` info object and reuse the identical DOM scan
 * ({@link ./githubDiffDom}); only `info` (which URLs count) and `load` (which
 * endpoint) vary.
 */

import { createDiffPlatform } from '../diff/createDiffPlatform'
import type { DiffPanelSlot, DiffPlatform } from '../diff/diffPlatform'
import { githubApiErrorHint } from '../net/githubApiAuth'
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
    errorHint: githubApiErrorHint,
  })
}

const slotOf = (box: FileBox): DiffPanelSlot => ({
  anchor: box.code,
  append: 'before',
  fileRoot: box.root,
})
