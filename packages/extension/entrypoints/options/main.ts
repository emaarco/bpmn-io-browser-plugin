import './options.css'

import { githubTokens, hostRegistry } from '../../src/git-hosts/hosts'
import { GithubDeviceFlow } from '../../src/git-hosts/github/GithubDeviceFlow'
import { HostAccess } from '../../src/host-access/HostAccess'
import { GithubAccessSection } from '../../src/options/GithubAccessSection'
import { SelfHostedHostsSection } from '../../src/options/SelfHostedHostsSection'

const app = document.querySelector<HTMLElement>('#app')!

new SelfHostedHostsSection(HostAccess.forHosts(hostRegistry), hostRegistry).mount(app)
new GithubAccessSection(new GithubDeviceFlow(), githubTokens).mount(app)
