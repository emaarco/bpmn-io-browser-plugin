import { describe, expect, it } from 'vitest'
import { kindDetector } from '../src/kinds/KindDetector'

describe('KindDetector', () => {
  it('maps .bpmn and .dmn to their kinds (case-insensitive)', () => {
    expect(kindDetector.detect('/group/repo/-/blob/main/flow.bpmn')?.id).toBe('bpmn')
    expect(kindDetector.detect('/org/repo/blob/main/decision.dmn')?.id).toBe('dmn')
    expect(kindDetector.detect('/x/y/Process.BPMN')?.id).toBe('bpmn')
    expect(kindDetector.detect('/x/y/Decision.DMN')?.id).toBe('dmn')
  })

  it('ignores dots in directories and returns null for unsupported files', () => {
    expect(kindDetector.detect('/a.b/c/readme.md')).toBeNull()
    expect(kindDetector.detect('/repo/-/blob/main/notes.txt')).toBeNull()
    expect(kindDetector.detect('/repo/-/blob/main/noext')).toBeNull()
    expect(kindDetector.detect('/repo/-/blob/main/order.bpmnx')).toBeNull()
    expect(kindDetector.detect(undefined)).toBeNull()
  })

  it('diffs only the kinds that support a diff', () => {
    expect(kindDetector.isDiffable('x/Order.BPMN')).toBe(true)
    expect(kindDetector.isDiffable('x/rules.dmn')).toBe(false)
    expect(kindDetector.isDiffable('x/order.bpmnx')).toBe(false)
    expect(kindDetector.isDiffable(null)).toBe(false)
  })

  it('lists the file extensions every kind renders', () => {
    expect(kindDetector.fileExtensions()).toEqual(['.bpmn', '.dmn'])
  })
})
