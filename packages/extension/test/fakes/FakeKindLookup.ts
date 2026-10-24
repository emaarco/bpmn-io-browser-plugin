import type { DiagramKind, KindLookup } from '../../src/kinds/DiagramKind'
import { DMN } from '../../src/kinds/kindCatalog'
import { FakeKind } from './FakeKind'

export class FakeKindLookup implements KindLookup {
  constructor(private readonly kinds: FakeKind[] = [new FakeKind(), new FakeKind(DMN, null)]) {}

  detect(path: string | null | undefined): DiagramKind | null {
    return (
      this.kinds.find((kind) => kind.descriptor.extensions.some((e) => path?.endsWith(`.${e}`))) ??
      null
    )
  }
}
