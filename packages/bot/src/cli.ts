/**
 * Spike CLI: `bpmn-diff <old.bpmn> <new.bpmn>` prints a Markdown diff report.
 *
 * This is the seed of a PR/MR bot: the same core that powers the extension runs
 * server-side, so a review comment can show what changed without anyone needing
 * to install anything.
 */

import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { describeDiff, parseBpmn } from '@bpmn-io-browser-plugin/core'
import { formatReport } from './formatReport'

const [oldPath, newPath] = process.argv.slice(2)
if (!oldPath || !newPath) {
  console.error('Usage: bpmn-diff <old.bpmn> <new.bpmn>')
  process.exit(1)
}

const [oldXml, newXml] = await Promise.all([readFile(oldPath, 'utf8'), readFile(newPath, 'utf8')])
const report = describeDiff(await parseBpmn(oldXml), await parseBpmn(newXml))
console.log(formatReport(report, basename(newPath)))
