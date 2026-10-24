import diagramCss from 'bpmn-js/dist/assets/diagram-js.css?inline'
import bpmnCss from 'bpmn-js/dist/assets/bpmn-js.css?inline'
import bpmnFontCss from 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css?inline'
import viewerCss from '../../styles/viewer.css?inline'
import diffCss from '../../styles/diff.css?inline'

export const BPMN_ASSET_CSS = [diagramCss, bpmnCss, bpmnFontCss].join('\n')
export const BPMN_PANEL_CSS = [BPMN_ASSET_CSS, viewerCss].join('\n')
export const BPMN_DIFF_CSS = [BPMN_ASSET_CSS, viewerCss, diffCss].join('\n')
