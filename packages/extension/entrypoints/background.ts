import { defineBackground } from 'wxt/utils/define-background'
import { BackgroundWorker } from '../src/background/BackgroundWorker'

export default defineBackground(() => {
  BackgroundWorker.create().start()
})
