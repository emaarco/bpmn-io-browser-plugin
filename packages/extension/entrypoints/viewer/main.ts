import './viewer.css'

import { kindDetector } from '../../src/kinds/KindDetector'
import { allKinds } from '../../src/kinds/allKinds'
import { StandaloneViewerPage } from '../../src/viewer-page/StandaloneViewerPage'

const app = document.querySelector<HTMLElement>('#app')!

new StandaloneViewerPage(allKinds, kindDetector.fileExtensions()).mount(app)
