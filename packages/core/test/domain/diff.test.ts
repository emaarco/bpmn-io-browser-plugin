import { describe, expect, it } from 'vitest'
import { computeDiff, diffBpmn, isEmptyDiff, parseBpmn } from '../../src/index'
import { readFixture } from '../fixtures'

const base = readFixture('base.bpmn')

async function diff(oldXml: string, newXml: string) {
  return computeDiff(await parseBpmn(oldXml), await parseBpmn(newXml))
}

describe('computeDiff', () => {
  it('reports no differences for an unchanged model', async () => {
    const result = await diff(base, base)
    expect(isEmptyDiff(result)).toBe(true)
  })

  it('detects an added element', async () => {
    const result = await diff(base, readFixture('added-task.bpmn'))
    expect(result.added).toEqual(['Task_2'])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
    expect(result.moved).toEqual([])
  })

  it('detects removed elements', async () => {
    const result = await diff(base, readFixture('removed-end.bpmn'))
    expect(result.removed.sort()).toEqual(['EndEvent_1', 'Flow_2'])
    expect(result.added).toEqual([])
    expect(result.changed).toEqual([])
    expect(result.moved).toEqual([])
  })

  it('detects a renamed element as changed', async () => {
    const renamed = base.replace('name="Do work"', 'name="Do redone work"')
    const result = await diff(base, renamed)
    expect(result.changed).toEqual(['Task_1'])
    expect(result.moved).toEqual([])
  })

  it('detects a zeebe extension property change (unregistered namespace)', async () => {
    const changed = base.replace('type="foo"', 'type="bar"')
    const result = await diff(base, changed)
    expect(result.changed).toEqual(['Task_1'])
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
  })

  it('detects a pure layout move without a semantic change', async () => {
    const moved = base.replace('x="250" y="78"', 'x="250" y="240"')
    const result = await diff(base, moved)
    expect(result.moved).toEqual(['Task_1'])
    expect(result.changed).toEqual([])
  })

  it('does not fold pool changes into the collaboration root', async () => {
    const collab = readFixture('collaboration.bpmn')
    const renamedPool = collab.replace('name="Buyer"', 'name="Purchaser"')
    const result = await diff(collab, renamedPool)
    // Only the participant itself changes — not the collaboration root that
    // contains it (participants/messageFlows are diffed as their own elements).
    expect(result.changed).toEqual(['Participant_1'])
  })
})

describe('diffBpmn', () => {
  it('parses both documents and diffs them', async () => {
    const result = await diffBpmn(base, readFixture('added-task.bpmn'))
    expect(result.added).toEqual(['Task_2'])
  })
})
