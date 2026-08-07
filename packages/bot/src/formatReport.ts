/**
 * Render a {@link DiffReport} as Markdown suitable for a PR/MR comment. Pure —
 * so it is unit-tested without touching the filesystem or a git host.
 */

import type { DiffEntry, DiffKind, DiffReport } from '@bpmn-io-browser-plugin/core'

const ORDER: DiffKind[] = ['added', 'removed', 'changed', 'moved']
const ICON: Record<DiffKind, string> = {
  added: '🟢',
  removed: '🔴',
  changed: '🔵',
  moved: '🟡',
}
const LABEL: Record<DiffKind, string> = {
  added: 'Added',
  removed: 'Removed',
  changed: 'Changed',
  moved: 'Moved',
}

function line(entry: DiffEntry): string {
  const label = entry.name ? `${entry.type} **${entry.name}**` : entry.type
  return `- ${ICON[entry.kind]} ${LABEL[entry.kind]} ${label} (\`${entry.id}\`)`
}

export function formatReport(report: DiffReport, title?: string): string {
  const heading = `### BPMN diff${title ? `: \`${title}\`` : ''}`
  if (report.entries.length === 0) return `${heading}\n\nNo BPMN changes.`

  const summary = ORDER.filter((kind) => report.counts[kind] > 0)
    .map((kind) => `${ICON[kind]} ${report.counts[kind]} ${LABEL[kind].toLowerCase()}`)
    .join(' · ')

  const details = report.entries.map(line).join('\n')
  return `${heading}\n\n${summary}\n\n${details}`
}
