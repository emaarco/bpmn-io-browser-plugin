import { defineContentScript } from 'wxt/utils/define-content-script'
import { gitlabHost } from '../src/git-hosts/hosts'
import { HostPage } from '../src/page/HostPage'
import { DiffController } from '../src/page/DiffController'

export default defineContentScript({
  registration: 'runtime',
  cssInjectionMode: 'manual',
  main(ctx) {
    new DiffController(new HostPage(ctx), gitlabHost.mergeRequestDiff).start()
  },
})
