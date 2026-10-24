import { describe, expect, it } from 'vitest'
import { allKinds } from '../../src/kinds/allKinds'
import { diffableKinds } from '../../src/kinds/diffableKinds'
import { KIND_CATALOG } from '../../src/kinds/kindCatalog'

describe('kind registries', () => {
  it('render every catalogued kind', () => {
    expect(allKinds.all().map((kind) => kind.descriptor)).toEqual(KIND_CATALOG)
  })

  it('offer a differ exactly for the kinds the catalogue marks as diffable', () => {
    for (const kind of allKinds.all()) {
      expect(kind.differ !== null, kind.descriptor.id).toBe(kind.descriptor.diffable)
    }
  })

  it('keep the diff registry to the diffable kinds, so diff pages skip the other viewers', () => {
    const diffable = KIND_CATALOG.filter((kind) => kind.diffable)
    expect(diffableKinds.all().map((kind) => kind.descriptor)).toEqual(diffable)
  })

  it('resolve a path to its kind', () => {
    expect(allKinds.detect('flows/order.bpmn')?.descriptor.id).toBe('bpmn')
    expect(diffableKinds.detect('rules/decide.dmn')).toBeNull()
    expect(allKinds.detect('README.md')).toBeNull()
  })
})
