import type { SettingsStore } from '../settings/SettingsStore'

const STORAGE_KEY = 'selfHostedHosts'

export interface SelfHostedHost {
  origin: string
  type?: string
}

export class SelfHostedHostStore {
  constructor(private readonly settings: SettingsStore) {}

  list(): Promise<SelfHostedHost[]> {
    return this.settings.readList<SelfHostedHost>(STORAGE_KEY)
  }

  async save(host: SelfHostedHost): Promise<void> {
    const hosts = await this.list()
    const existing = hosts.find((saved) => saved.origin === host.origin)
    const others = hosts.filter((saved) => saved.origin !== host.origin)
    await this.write([...others, { ...existing, ...host }])
  }

  async remove(origin: string): Promise<void> {
    await this.write((await this.list()).filter((saved) => saved.origin !== origin))
  }

  private async write(hosts: SelfHostedHost[]): Promise<void> {
    const sorted = [...hosts].sort((a, b) => a.origin.localeCompare(b.origin))
    await this.settings.writeList(STORAGE_KEY, sorted)
  }
}
