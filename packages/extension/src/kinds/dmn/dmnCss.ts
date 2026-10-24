import diagramCss from 'bpmn-js/dist/assets/diagram-js.css?inline'
import dmnSharedCss from 'dmn-js/dist/assets/dmn-js-shared.css?inline'
import dmnDrdCss from 'dmn-js/dist/assets/dmn-js-drd.css?inline'
import dmnDecisionTableCss from 'dmn-js/dist/assets/dmn-js-decision-table.css?inline'
import dmnDecisionTableControlsCss from 'dmn-js/dist/assets/dmn-js-decision-table-controls.css?inline'
import dmnLiteralCss from 'dmn-js/dist/assets/dmn-js-literal-expression.css?inline'
import dmnFontCss from 'dmn-js/dist/assets/dmn-font/css/dmn-embedded.css?inline'
import viewerCss from '../../styles/viewer.css?inline'
import dmnPanelCss from './dmn.css?inline'

export const DMN_ASSET_CSS = [
  diagramCss,
  dmnSharedCss,
  dmnDrdCss,
  dmnDecisionTableCss,
  dmnDecisionTableControlsCss,
  dmnLiteralCss,
  dmnFontCss,
].join('\n')

export const DMN_PANEL_CSS = [DMN_ASSET_CSS, viewerCss, dmnPanelCss].join('\n')
