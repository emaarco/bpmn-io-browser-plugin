/**
 * A "diagram kind" is a renderable model format (BPMN, DMN, …). Each kind knows
 * its file extensions, the CSS its viewer needs inside a shadow root, and how to
 * spin up a themed viewer for a given XML string.
 *
 * This is the seam that keeps the blob viewer, standalone page and (later) the
 * MR panel format-agnostic: adding a format means adding one {@link DiagramKind}
 * to the registry — nothing else hard-codes ".bpmn".
 */

/**
 * A minimal, library-agnostic handle over an underlying bpmn-js / dmn-js viewer.
 * Enough for the panels to drive zoom and clean up; format-specific features
 * (e.g. the BPMN diff markers) reach past this to the concrete viewer.
 */
export interface DiagramViewer {
  /** Fit the diagram to the viewport (no-op for views without a canvas). */
  fit(): void
  /** Zoom by a factor, or `'fit'` to fit the viewport. */
  zoom(factor: number | 'fit'): void
  /** Enable/disable wheel zoom; the panel turns it on only while focused. */
  setInteractive(active: boolean): void
  destroy(): void
}

import type { KindId } from './detect'

export interface DiagramKind {
  readonly id: KindId
  /** Human label shown in placeholders / errors, e.g. `'BPMN'`. */
  readonly label: string
  /** The CSS bundle this kind's viewer needs, injected into its shadow root. */
  readonly css: string
  /** Create a themed viewer, import the XML and fit it. Rejects on render error. */
  createViewer(canvas: HTMLElement, xml: string): Promise<DiagramViewer>
}
