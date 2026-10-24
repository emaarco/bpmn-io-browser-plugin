import type { SettingsStore } from '../../settings/SettingsStore'

const TOKEN_KEY = 'githubApiToken'
const LOGIN_KEY = 'githubLogin'

export class GithubTokenStore {
  constructor(private readonly settings: SettingsStore) {}

  async token(): Promise<string> {
    return (await this.settings.readString(TOKEN_KEY)).trim()
  }

  login(): Promise<string> {
    return this.settings.readString(LOGIN_KEY)
  }

  async connect(token: string, login: string): Promise<void> {
    await this.settings.writeString(TOKEN_KEY, token)
    await this.settings.writeString(LOGIN_KEY, login)
  }

  async disconnect(): Promise<void> {
    await this.connect('', '')
  }
}
