import { describe, expect, it } from 'vitest'
import type { BpmnDiff } from '@bpmn-io-browser-plugin/core'
import { applyMarkers, changedIds, MARKER } from '../../src/diff/markers'

/** A minimal stand-in for a bpmn-js viewer: records which markers land on which
 * element, and only knows about the ids we say it has. */
function fakeViewer(knownIds: string[]) {
  const marks: Array<{ id: string; cls: string }> = []
  const registry = new Set(knownIds)
  return {
    marks,
    get: (service: string) => {
      if (service === 'canvas')
        return { addMarker: (id: string, cls: string) => marks.push({ id, cls }) }
      if (service === 'elementRegistry')
        return { get: (id: string) => (registry.has(id) ? {} : undefined) }
      throw new Error(`unexpected service ${service}`)
    },
  }
}

const diff: BpmnDiff = {
  added: ['A'],
  removed: ['R'],
  changed: ['C'],
  moved: ['M'],
}

describe('applyMarkers', () => {
  it('marks added/changed/moved on the new viewer and removed/changed/moved on the old', () => {
    const oldViewer = fakeViewer(['R', 'C', 'M'])
    const newViewer = fakeViewer(['A', 'C', 'M'])

    applyMarkers(oldViewer, newViewer, diff)

    expect(newViewer.marks).toEqual([
      { id: 'A', cls: MARKER.added },
      { id: 'C', cls: MARKER.changed },
      { id: 'M', cls: MARKER.moved },
    ])
    expect(oldViewer.marks).toEqual([
      { id: 'R', cls: MARKER.removed },
      { id: 'C', cls: MARKER.changed },
      { id: 'M', cls: MARKER.moved },
    ])
  })

  it('skips ids the viewer does not know and tolerates a null viewer', () => {
    const newViewer = fakeViewer([]) // knows nothing → nothing marked
    expect(() => applyMarkers(null, newViewer, diff)).not.toThrow()
    expect(newViewer.marks).toEqual([])
  })
})

describe('changedIds', () => {
  it('unions all four buckets without duplicates, stable order', () => {
    expect(changedIds({ added: ['A'], removed: ['R'], changed: ['A'], moved: ['M'] })).toEqual([
      'A',
      'R',
      'M',
    ])
  })
})
