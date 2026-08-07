import { describe, expect, it } from 'vitest'
import { parseBpmn } from '../../src/index'
import { readFixture } from '../fixtures'

describe('parseBpmn', () => {
  it('indexes every diagram element (plus the process root) by id', async () => {
    const model = await parseBpmn(readFixture('base.bpmn'))
    expect([...model.keys()].sort()).toEqual([
      'EndEvent_1',
      'Flow_1',
      'Flow_2',
      'Process_1',
      'StartEvent_1',
      'Task_1',
    ])
  })

  it('pairs shapes with their semantic business object and layout', async () => {
    const model = await parseBpmn(readFixture('base.bpmn'))
    const task = model.get('Task_1')!
    expect(task.businessObject.$type).toBe('bpmn:ServiceTask')
    expect(task.isConnection).toBe(false)
    expect({ x: task.x, y: task.y, width: task.width, height: task.height }).toEqual({
      x: 250,
      y: 78,
      width: 100,
      height: 80,
    })
  })

  it('marks edges as connections and keeps their waypoints', async () => {
    const model = await parseBpmn(readFixture('base.bpmn'))
    const flow = model.get('Flow_1')!
    expect(flow.isConnection).toBe(true)
    expect(flow.waypoints).toEqual([
      { x: 186, y: 118 },
      { x: 250, y: 118 },
    ])
  })
})
