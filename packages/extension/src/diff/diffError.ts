/**
 * A small, static notice shown in a changed file's slot when the diff metadata
 * could not be loaded (e.g. a private repo without a token, or a rate limit).
 * Replaces the old silent `console.error`: the raw message plus a short,
 * actionable hint, themed to match the host page. See {@link ../diff/diffPlatform}
 * `DiffDataError` for where the message/hint come from.
 */

import { h } from '../dom'
import { detectHostTheme } from '../theme'

export interface DiffErrorHandle {
  destroy(): void
}

export function mountDiffError(
  container: HTMLElement,
  info: { message: string; hint: string },
): DiffErrorHandle {
  const root = h('div', { class: 'git-diagram-wrap git-diagram-di-root git-diagram-error' }, [
    h('div', { class: 'git-diagram-error-title', text: 'BPMN diff unavailable' }),
    h('div', { class: 'git-diagram-error-hint', text: info.hint }),
    h('div', { class: 'git-diagram-error-detail', text: info.message }),
  ])
  container.append(root)
  root.dataset.theme = detectHostTheme(root)
  return {
    destroy() {
      root.remove()
    },
  }
}
