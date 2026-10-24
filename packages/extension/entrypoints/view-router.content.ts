import { defineContentScript } from 'wxt/utils/define-content-script'
import { backgroundClient, hostRegistry } from '../src/git-hosts/hosts'
import { HostPage } from '../src/page/HostPage'
import { ViewRouter } from '../src/page/ViewRouter'
import { withE2eMatches } from '../src/utils/e2eMatches'

export default defineContentScript({
  matches: withE2eMatches(hostRegistry.publicMatchPatterns(), ['http://localhost/*']),
  runAt: 'document_idle',
  main(ctx) {
    new ViewRouter(new HostPage(ctx), hostRegistry, backgroundClient).start()
  },
})
