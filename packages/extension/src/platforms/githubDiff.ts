/**
 * GitHub pull-request {@link DiffPlatform}: finds changed `.bpmn` file boxes on
 * the Files tab and wires each to base/head raw URLs, using PR metadata (SHAs,
 * per-file status) loaded once from the GitHub REST API. The DOM scan and the
 * per-page caching are shared with the single-commit platform — see
 * {@link ./githubDiffDom} and {@link ./githubDiffPlatform}.
 */

import type { DiffPlatform } from '../diff/diffPlatform'
import { createGithubDiffPlatform } from './githubDiffPlatform'
import { loadPrData } from './githubPr'
import { prInfo } from './githubPrUrls'

export function githubDiffPlatform(): DiffPlatform {
  return createGithubDiffPlatform(prInfo, loadPrData)
}
