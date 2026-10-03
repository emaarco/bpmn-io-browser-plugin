import { defineContentScript } from 'wxt/utils/define-content-script'
import { githubPlatform } from '../src/platforms/github'
import { runBlobViewer } from '../src/inject/blobViewer'

export default defineContentScript({
  registration: 'runtime',
  cssInjectionMode: 'manual',
  main(ctx) {
    runBlobViewer(ctx, githubPlatform)
  },
})
