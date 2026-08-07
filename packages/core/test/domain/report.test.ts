import { describe, expect, it } from 'vitest'
import { describeDiff, parseBpmn } from '../../src/index'
import { readFixture } from '../fixtures'

const base = readFixture('base.bpmn')

async function report(oldXml: string, newXml: string) {
  return describeDiff(await parseBpmn(oldXml), await parseBpmn(newXml))
}

describe('describeDiff', () => {
  it('enriches an added element with its type and name', async () => {
    const result = await report(base, readFixture('added-task.bpmn'))
    expect(result.counts.added).toBe(1)
    expect(result.entries).toContainEqual({
      id: 'Task_2',
      kind: 'added',
      type: 'ServiceTask',
      name: 'Extra work',
    })
  })

  it('describes a changed element by name', async () => {
    const changed = base.replace('name="Do work"', 'name="Do redone work"')
    const result = await report(base, changed)
    expect(result.entries).toEqual([
      { id: 'Task_1', kind: 'changed', type: 'ServiceTask', name: 'Do redone work' },
    ])
  })

  it('lists removed elements from the old model', async () => {
    const result = await report(base, readFixture('removed-end.bpmn'))
    const removed = result.entries.filter((e) => e.kind === 'removed').map((e) => e.id)
    expect(removed.sort()).toEqual(['EndEvent_1', 'Flow_2'])
    expect(result.entries.find((e) => e.id === 'EndEvent_1')).toMatchObject({
      type: 'EndEvent',
      name: 'Done',
    })
  })
})
