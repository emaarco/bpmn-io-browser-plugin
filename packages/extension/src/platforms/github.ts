import { createBlobPlatform } from './types'
import { githubSelectors } from './github.selectors'

export const githubPlatform = createBlobPlatform({
  id: 'github',
  blobSegment: '/blob/',
  rawSegment: '/raw/',
  contentSelectors: githubSelectors.blob.content,
  insertClimb: githubSelectors.blob.insertClimb,
})
