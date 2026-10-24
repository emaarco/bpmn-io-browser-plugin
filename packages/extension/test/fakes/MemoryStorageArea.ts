import type { StorageArea } from '../../src/settings/SettingsStore'

export class MemoryStorageArea implements StorageArea {
  readonly items: Record<string, unknown> = {}

  async get(key: string): Promise<Record<string, unknown>> {
    return key in this.items ? { [key]: this.items[key] } : {}
  }

  async set(items: Record<string, unknown>): Promise<void> {
    Object.assign(this.items, items)
  }

  async remove(key: string): Promise<void> {
    delete this.items[key]
  }
}
