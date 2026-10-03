import { defineContentScript } from 'wxt/utils/define-content-script'
import { runViewRouter } from '../src/inject/viewRouter'
import { withE2eMatches } from '../src/hosts/e2eMatches'

export default defineContentScript({
  matches: withE2eMatches(['https://github.com/*', 'https://gitlab.com/*'], ['http://localhost/*']),
  runAt: 'document_idle',
  main(ctx) {
    runViewRouter(ctx)
  },
})
