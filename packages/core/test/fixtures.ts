import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')

/** Read a `.bpmn` fixture as a UTF-8 string. */
export function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf8')
}
