/**
 * GitLab merge-request {@link DiffPlatform}: finds changed `.bpmn` file boxes on
 * the Changes tab and wires each to base/head raw URLs, using MR metadata (SHAs,
 * per-file change info) loaded once from the GitLab REST API.
 */

import type { DiffFileBlock, DiffPlatform } from '../diff/diffPlatform'
import { fetchText } from '../net/client'
import { isBpmnPath, loadMrData, mrInfo, rawFileUrl, type MrData, type MrInfo } from './gitlabMr'

interface FileBox {
  path: string
  content: HTMLElement
}

export function gitlabDiffPlatform(): DiffPlatform {
  let cached: { key: string; promise: Promise<MrData> } | null = null

  const ensureData = (location: Location, info: MrInfo): Promise<MrData> => {
    if (cached?.key === info.key) return cached.promise
    const promise = loadMrData(location, info).catch((err) => {
      if (cached?.key === info.key) cached = null // let the next run retry
      throw err
    })
    cached = { key: info.key, promise }
    return promise
  }

  return {
    pageKey: (location) => mrInfo(location)?.key ?? null,
    async collect(location, doc) {
      const info = mrInfo(location)
      if (!info) return []
      const boxes = bpmnFileBoxes(doc)
      if (!boxes.length) return []
      const data = await ensureData(location, info)
      return boxes.map((box) => toBlock(box, data))
    },
  }
}

function toBlock(box: FileBox, data: MrData): DiffFileBlock {
  const change = data.changeByPath.get(box.path)
  const oldPath = change?.old_path || box.path
  return {
    path: box.path,
    anchor: box.content,
    append: 'first',
    loadOld: () =>
      change?.new_file
        ? Promise.resolve(null)
        : fetchText(rawFileUrl(data.origin, data.pid, oldPath, data.refs.base_sha)),
    loadNew: () =>
      change?.deleted_file
        ? Promise.resolve(null)
        : fetchText(rawFileUrl(data.origin, data.pid, box.path, data.refs.head_sha)),
  }
}

function bpmnFileBoxes(doc: Document): FileBox[] {
  const roots = doc.querySelectorAll<HTMLElement>('.diff-file, [data-testid="file-holder"]')
  const boxes: FileBox[] = []
  roots.forEach((root) => {
    const path = filePathOf(root)
    if (!isBpmnPath(path)) return
    boxes.push({ path: path!, content: contentOf(root) })
  })
  return boxes
}

function filePathOf(root: HTMLElement): string | null {
  const withData = root.matches('[data-path]') ? root : root.querySelector('[data-path]')
  if (withData) return withData.getAttribute('data-path')
  const titleEl = root.querySelector('.file-title-name, [data-testid="file-title"]')
  if (titleEl) return titleEl.getAttribute('title') || titleEl.textContent?.trim() || null
  return null
}

function contentOf(root: HTMLElement): HTMLElement {
  const explicit = root.querySelector<HTMLElement>('.diff-content, [data-testid="diff-content"]')
  if (explicit) return explicit
  const title = root.querySelector<HTMLElement>(
    '.file-title, .js-file-title, [data-testid="file-title"], .file-title-flex-parent',
  )
  const next = title?.nextElementSibling
  if (next instanceof HTMLElement) return next
  return root
}
