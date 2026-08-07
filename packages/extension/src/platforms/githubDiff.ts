/**
 * GitHub pull-request {@link DiffPlatform}: finds changed `.bpmn` file boxes on
 * the Files tab and wires each to base/head raw URLs, using PR metadata (SHAs,
 * per-file status) loaded once from the GitHub REST API.
 */

import type { DiffFileBlock, DiffPlatform } from '../diff/diffPlatform'
import { fetchText } from '../net/client'
import { isBpmnPath, loadPrData, prInfo, rawFileUrl, type PrData, type PrInfo } from './githubPr'

interface FileBox {
  path: string
  code: HTMLElement
}

export function githubDiffPlatform(): DiffPlatform {
  let cached: { key: string; promise: Promise<PrData> } | null = null

  const ensureData = (location: Location, info: PrInfo): Promise<PrData> => {
    if (cached?.key === info.key) return cached.promise
    const promise = loadPrData(location, info).catch((err) => {
      if (cached?.key === info.key) cached = null // let the next run retry
      throw err
    })
    cached = { key: info.key, promise }
    return promise
  }

  return {
    pageKey: (location) => prInfo(location)?.key ?? null,
    async collect(location, doc) {
      const info = prInfo(location)
      if (!info) return []
      const boxes = bpmnFileBoxes(doc)
      if (!boxes.length) return []
      const data = await ensureData(location, info)
      return boxes.map((box) => toBlock(location, box, data))
    },
  }
}

function toBlock(location: Location, box: FileBox, data: PrData): DiffFileBlock {
  const file = data.fileByPath.get(box.path)
  const status = file?.status
  const oldPath = file?.previous_filename || box.path
  return {
    path: box.path,
    anchor: box.code,
    append: 'before',
    loadOld: () =>
      status === 'added'
        ? Promise.resolve(null)
        : fetchText(rawFileUrl(location, data.baseRepo, data.baseSha, oldPath)),
    loadNew: () =>
      status === 'removed'
        ? Promise.resolve(null)
        : fetchText(rawFileUrl(location, data.headRepo, data.headSha, box.path)),
  }
}

function bpmnFileBoxes(doc: Document): FileBox[] {
  const roots = doc.querySelectorAll<HTMLElement>('.file[data-tagsearch-path], .js-file')
  const boxes: FileBox[] = []
  roots.forEach((root) => {
    const path = filePathOf(root)
    if (!isBpmnPath(path)) return
    const code = codeOf(root)
    if (code) boxes.push({ path: path!, code })
  })
  return boxes
}

function filePathOf(root: HTMLElement): string | null {
  const attr = root.getAttribute('data-tagsearch-path') || root.getAttribute('data-path')
  if (attr) return attr
  const info = root.querySelector('.file-info a, .file-header [title]')
  return info?.getAttribute('title') || info?.textContent?.trim() || null
}

function codeOf(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>('.js-file-content, .data.highlight, .diff-table')
}
