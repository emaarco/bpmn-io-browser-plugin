import { defineConfig } from 'wxt'

// `npm run dev:example` opens the browser at our own in-repo fixtures so the
// git-host views can be exercised without depending on foreign repos:
//   - two blob pages (BPMN + DMN) exercise the inline viewer
//   - a permanently-closed demo PR (#12) exercises the before/after diff view
// The fixtures live on `main` at packages/extension/e2e/fixtures and are the
// same files the e2e suite renders.
const REPO = 'https://github.com/emaarco/bpmn-io-browser-plugin'
const FIXTURES = `${REPO}/blob/main/packages/extension/e2e/fixtures`
const EXAMPLE_URLS = [
  `${FIXTURES}/sample.bpmn`, // inline viewer — BPMN
  `${FIXTURES}/sample.dmn`, // inline viewer — DMN
  `${REPO}/pull/12/files`, // diff viewer — closed demo PR (do not merge/delete)
]
const openExample = Boolean(
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.WXT_DEV_EXAMPLE,
)

// https://wxt.dev/api/config.html
export default defineConfig({
  manifestVersion: 3,
  vite: () => ({
    plugins: [
      {
        name: 'gdv-escape-noncharacters',
        generateBundle(_options: unknown, bundle: Record<string, { type: string; code?: string }>) {
          for (const file of Object.values(bundle)) {
            if (file.type === 'chunk' && file.code) {
              file.code = file.code.replace(
                /[\uFDD0-\uFDEF\uFFFE\uFFFF]/g,
                (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'),
              )
            }
          }
        },
      },
    ],
  }),
  webExt: {
    startUrls: openExample ? EXAMPLE_URLS : undefined,
  },
  manifest: {
    name: 'BPMN & DMN for GitHub & GitLab',
    description:
      'Render BPMN & DMN diagrams inline on GitLab & GitHub and show a visual before/after diff in merge/pull requests. Includes a standalone diagram viewer.',
    permissions: ['scripting', 'storage', 'contextMenus', 'activeTab'],
    action: {
      default_icon: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '128': 'icon/128.png',
      },
    },
    host_permissions: [
      'https://gitlab.com/*',
      'https://github.com/*',
      'https://raw.githubusercontent.com/*',
      'https://api.github.com/*',
    ],
    optional_host_permissions: ['*://*/*'],
    browser_specific_settings: {
      gecko: { id: 'git-diagram-viewer@emaarco.github.io' },
    },
  },
})
