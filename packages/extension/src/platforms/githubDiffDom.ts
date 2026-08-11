/**
 * Shared GitHub diff DOM layer: scans the rendered page for changed `.bpmn` file
 * boxes and wires each to its base/head raw URLs. Used by both the pull-request
 * ({@link ./githubDiff}) and single-commit ({@link ./githubCommitDiff})
 * platforms — the "Files changed" and commit diff pages share the same legacy and
 * React markup, so only the metadata *source* (which REST endpoint yields the
 * SHAs and per-file status) differs, not this scan.
 */

import type { DiffFileBlock } from '../diff/diffPlatform'
import { fetchText } from '../net/client'
import { isRendered } from '../util/isRendered'
import { githubSelectors } from './github.selectors'
import { isBpmnPath, normalizeDiffPath, rawFileUrl } from './githubPrUrls'

/** Per-file diff metadata, sourced once per page from a REST endpoint. */
export interface GithubDiffFile {
  filename: string
  previous_filename?: string
  /** added | removed | modified | renamed | copied | changed | unchanged */
  status: string
}

/**
 * The base/head coordinates a diff page renders, host-agnostic between a PR
 * (base = merge target, head = source, possibly a fork) and a commit (base =
 * parent, head = the commit itself, same repo).
 */
export interface GithubDiffData {
  baseRepo: string
  baseSha: string
  headRepo: string
  headSha: string
  fileByPath: Map<string, GithubDiffFile>
}

export interface FileBox {
  path: string
  code: HTMLElement
  root: HTMLElement
}

/** All `.bpmn` file boxes currently in the DOM (before any metadata is fetched). */
export function scanBpmnFileBoxes(doc: Document): FileBox[] {
  const boxes: FileBox[] = []
  const seen = new Set<HTMLElement>()
  for (const root of fileRoots(doc)) {
    if (seen.has(root)) continue
    seen.add(root)
    const path = filePathOf(root)
    if (!isBpmnPath(path)) continue
    const code = codeOf(root)
    if (code) boxes.push({ path: path!, code, root })
  }
  return boxes
}

/** Wire one scanned box to the base/head raw URLs derived from `data`. */
export function toBlock(location: Location, box: FileBox, data: GithubDiffData): DiffFileBlock {
  const file = data.fileByPath.get(box.path)
  const status = file?.status
  const oldPath = file?.previous_filename || box.path
  return {
    path: box.path,
    anchor: box.code,
    append: 'before',
    fileRoot: box.root,
    isCollapsed: () => !isRendered(codeOf(box.root)),
    loadOld: () =>
      status === 'added' || !data.baseSha
        ? Promise.resolve(null)
        : fetchText(rawFileUrl(location, data.baseRepo, data.baseSha, oldPath)),
    loadNew: () =>
      status === 'removed'
        ? Promise.resolve(null)
        : fetchText(rawFileUrl(location, data.headRepo, data.headSha, box.path)),
  }
}

/**
 * Per-file diff containers for both the legacy diff and the React "Files changed"
 * experience. The React class names are hashed, so we key on the stable
 * `data-diff-header-wrapper` hook and climb to the owning `#diff-<hash>`.
 */
function fileRoots(doc: Document): HTMLElement[] {
  const legacy = [...doc.querySelectorAll<HTMLElement>(githubSelectors.diff.fileRootLegacy)]
  const modern = [...doc.querySelectorAll<HTMLElement>(githubSelectors.diff.diffHeaderWrapper)]
    .map((header) => header.closest<HTMLElement>(githubSelectors.diff.modernRootClimb))
    .filter((el): el is HTMLElement => el !== null)
  return [...legacy, ...modern]
}

function filePathOf(root: HTMLElement): string | null {
  const attr = githubSelectors.diff.pathAttrs
    .map((name) => root.getAttribute(name))
    .find((value): value is string => !!value)
  if (attr) return attr
  const modern = modernFilePath(root)
  if (modern) return modern
  const info = root.querySelector(githubSelectors.diff.legacyPathEl)
  return info?.getAttribute('title') || info?.textContent?.trim() || null
}

/** React experience: the container's `aria-labelledby` heading holds the path. */
function modernFilePath(root: HTMLElement): string | null {
  const headingId = root.getAttribute('aria-labelledby')
  const heading = headingId ? root.ownerDocument.getElementById(headingId) : null
  const raw =
    heading?.textContent ?? root.querySelector(githubSelectors.diff.modernHeading)?.textContent
  return raw ? normalizeDiffPath(raw) || null : null
}

function codeOf(root: HTMLElement): HTMLElement | null {
  const modern = root.querySelector<HTMLElement>(githubSelectors.diff.modernCode)
  if (modern) return modern.parentElement ?? modern
  return root.querySelector<HTMLElement>(githubSelectors.diff.legacyCode)
}
