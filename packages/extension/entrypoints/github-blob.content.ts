import { defineContentScript } from 'wxt/utils/define-content-script'
import { githubPlatform } from '../src/platforms/github'
import { runBlobViewer } from '../src/inject/blobViewer'
import { withE2eMatches } from '../src/hosts/e2eMatches'

export default defineContentScript({
  matches: withE2eMatches(['https://github.com/*/blob/*'], ['http://localhost/*/blob/*']),
  cssInjectionMode: 'manual',
  runAt: 'document_idle',
  main(ctx) {
    runBlobViewer(ctx, githubPlatform)
  },
})
