import { describe, expect, it } from 'vitest'
import { formatReport } from '../src/formatReport'

describe('formatReport', () => {
  it('renders a summary line and per-element details', () => {
    const md = formatReport(
      {
        counts: { added: 1, removed: 0, changed: 1, moved: 0 },
        entries: [
          { id: 'Task_2', kind: 'added', type: 'ServiceTask', name: 'Extra work' },
          { id: 'Task_1', kind: 'changed', type: 'ServiceTask', name: 'Do work' },
        ],
      },
      'order.bpmn',
    )
    expect(md).toContain('### BPMN diff: `order.bpmn`')
    expect(md).toContain('🟢 1 added · 🔵 1 changed')
    expect(md).toContain('- 🟢 Added ServiceTask **Extra work** (`Task_2`)')
    expect(md).toContain('- 🔵 Changed ServiceTask **Do work** (`Task_1`)')
  })

  it('reports when there are no changes', () => {
    const md = formatReport({ counts: { added: 0, removed: 0, changed: 0, moved: 0 }, entries: [] })
    expect(md).toContain('No BPMN changes.')
  })
})
