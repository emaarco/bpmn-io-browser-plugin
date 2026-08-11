/**
 * GitHub single-commit {@link DiffPlatform}: finds changed `.bpmn` file boxes on
 * a `/commit/<sha>` page and wires each to base(parent)/head(commit) raw URLs.
 * Shares the DOM scan and per-page caching with the pull-request platform — see
 * {@link ./githubDiffDom} and {@link ./githubDiffPlatform}.
 */

import type { DiffPlatform } from '../diff/diffPlatform'
import { loadCommitData, commitInfo } from './githubCommit'
import { createGithubDiffPlatform } from './githubDiffPlatform'

export function githubCommitDiffPlatform(): DiffPlatform {
  return createGithubDiffPlatform(commitInfo, loadCommitData)
}
