import { createBlobPlatform } from './types'
import { gitlabSelectors } from './gitlab.selectors'

export const gitlabPlatform = createBlobPlatform({
  id: 'gitlab',
  blobSegment: '/-/blob/',
  rawSegment: '/-/raw/',
  contentSelectors: gitlabSelectors.blob.content,
  insertClimb: gitlabSelectors.blob.insertClimb,
})
