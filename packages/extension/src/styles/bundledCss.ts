/**
 * Viewer libraries' CSS + our own styles bundled as strings, injected directly
 * into each shadow root. Doing it manually (instead of via
 * web_accessible_resources) means the styles work on *any* origin — including
 * user-added self-hosted instances — without widening resource matches.
 *
 * Each diagram kind gets its own bundle (it only needs its own library's CSS);
 * they all share `viewer.css` for the toolbar/tab/button chrome + design tokens.
 */

import diagramCss from 'bpmn-js/dist/assets/diagram-js.css?inline'
import bpmnCss from 'bpmn-js/dist/assets/bpmn-js.css?inline'
import bpmnFontCss from 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css?inline'

import dmnSharedCss from 'dmn-js/dist/assets/dmn-js-shared.css?inline'
import dmnDrdCss from 'dmn-js/dist/assets/dmn-js-drd.css?inline'
import dmnDecisionTableCss from 'dmn-js/dist/assets/dmn-js-decision-table.css?inline'
import dmnDecisionTableControlsCss from 'dmn-js/dist/assets/dmn-js-decision-table-controls.css?inline'
import dmnLiteralCss from 'dmn-js/dist/assets/dmn-js-literal-expression.css?inline'
import dmnFontCss from 'dmn-js/dist/assets/dmn-font/css/dmn-embedded.css?inline'

import viewerCss from './viewer.css?inline'
import diffCss from './diff.css?inline'

const BPMN_ASSET_CSS = [diagramCss, bpmnCss, bpmnFontCss].join('\n')
const DMN_ASSET_CSS = [
  diagramCss,
  dmnSharedCss,
  dmnDrdCss,
  dmnDecisionTableCss,
  dmnDecisionTableControlsCss,
  dmnLiteralCss,
  dmnFontCss,
].join('\n')

/** Blob viewer + standalone: BPMN. */
export const BPMN_SHADOW_CSS = [BPMN_ASSET_CSS, viewerCss].join('\n')
/** Blob viewer + standalone: DMN (DRD + decision tables). */
export const DMN_SHADOW_CSS = [DMN_ASSET_CSS, viewerCss].join('\n')
/** Merge-request diff view (BPMN markers) — reuses the viewer chrome + diff styles. */
export const DIFF_SHADOW_CSS = [BPMN_ASSET_CSS, viewerCss, diffCss].join('\n')
