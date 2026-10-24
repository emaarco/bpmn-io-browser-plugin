import { KIND_CATALOG, type KindDescriptor } from './kindCatalog'

const FILE_EXTENSION = /\.([^./]+)$/

export class KindDetector {
  constructor(private readonly catalog: readonly KindDescriptor[] = KIND_CATALOG) {}

  detect(path: string | null | undefined): KindDescriptor | null {
    const extension = path ? FILE_EXTENSION.exec(path)?.[1]?.toLowerCase() : undefined
    if (!extension) return null
    return this.catalog.find((kind) => kind.extensions.includes(extension)) ?? null
  }

  isDiffable(path: string | null | undefined): boolean {
    return this.detect(path)?.diffable ?? false
  }

  fileExtensions(): string[] {
    return this.catalog.flatMap((kind) => kind.extensions.map((extension) => `.${extension}`))
  }
}

export const kindDetector = new KindDetector()
