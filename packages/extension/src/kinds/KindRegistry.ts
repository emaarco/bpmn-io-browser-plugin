import type { DiagramKind, KindLookup } from './DiagramKind'
import { kindDetector, type KindDetector } from './KindDetector'

export class KindRegistry implements KindLookup {
  constructor(
    private readonly kinds: readonly DiagramKind[],
    private readonly detector: KindDetector = kindDetector,
  ) {}

  detect(path: string | null | undefined): DiagramKind | null {
    const descriptor = this.detector.detect(path)
    return this.kinds.find((kind) => kind.descriptor === descriptor) ?? null
  }

  all(): readonly DiagramKind[] {
    return this.kinds
  }
}
