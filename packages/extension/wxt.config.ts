import { defineConfig } from 'wxt'

// `npm run dev:example` opens the browser at a real .bpmn and .dmn file
const EXAMPLE_URLS = [
  'https://github.com/Miragon/bpmn-to-code/blob/main/shared/bpmn/c7-additional-variables.bpmn',
  'https://github.com/emaarco/dmn-js-simulation/blob/main/packages/example/public/recommend-bike.dmn',
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
    name: 'Git Diagram Viewer – BPMN & DMN',
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
