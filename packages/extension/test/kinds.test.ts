import { describe, expect, it } from 'vitest'
import { detectKindId } from '../src/kinds/detect'

describe('detectKindId', () => {
  it('maps .bpmn and .dmn to their kinds (case-insensitive)', () => {
    expect(detectKindId('/group/repo/-/blob/main/flow.bpmn')).toBe('bpmn')
    expect(detectKindId('/org/repo/blob/main/decision.dmn')).toBe('dmn')
    expect(detectKindId('/x/y/Process.BPMN')).toBe('bpmn')
    expect(detectKindId('/x/y/Decision.DMN')).toBe('dmn')
  })

  it('ignores dots in directories and returns null for unsupported files', () => {
    expect(detectKindId('/a.b/c/readme.md')).toBeNull()
    expect(detectKindId('/repo/-/blob/main/notes.txt')).toBeNull()
    expect(detectKindId('/repo/-/blob/main/noext')).toBeNull()
    expect(detectKindId('/repo/-/blob/main/order.bpmnx')).toBeNull()
  })
})
