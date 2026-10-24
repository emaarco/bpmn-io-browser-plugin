import { BackgroundClient } from '../messaging/BackgroundClient'
import { SettingsStore } from '../settings/SettingsStore'
import { GithubHost } from './github/GithubHost'
import { GithubTokenStore } from './github/GithubTokenStore'
import { GitlabHost } from './gitlab/GitlabHost'
import { HostRegistry } from './HostRegistry'

export const backgroundClient = new BackgroundClient()
export const githubTokens = new GithubTokenStore(new SettingsStore())
export const githubHost = new GithubHost(backgroundClient, githubTokens)
export const gitlabHost = new GitlabHost(backgroundClient)
export const hostRegistry = new HostRegistry([gitlabHost, githubHost], githubHost)
