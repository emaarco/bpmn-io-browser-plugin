import { defineConfig } from 'wxt'

// `npm run dev:example` opens the browser straight at a real .bpmn file.
const EXAMPLE_URL =
  'https://github.com/Miragon/bpmn-to-code/blob/main/shared/bpmn/c7-additional-variables.bpmn'
const openExample = Boolean(
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.WXT_DEV_EXAMPLE,
)

// https://wxt.dev/api/config.html
export default defineConfig({
  manifestVersion: 3,
  // Escape Unicode noncharacters (U+FDD0–U+FDEF, U+FFFE, U+FFFF) to `\uXXXX` in
  // the final bundles. bpmn-js/dmn-js embed U+FFFF as a lexer sentinel; it is
  // valid-decodable UTF-8 but a *noncharacter*, and Chrome's content-script
  // loader rejects it ("file is not UTF-8 encoded"), refusing to load the whole
  // extension. The escape is byte-different but identical in JS strings/regex.
  vite: () => ({
    plugins: [
      {
        name: 'gdv-escape-noncharacters',
        // generateBundle runs after minification, so our escapes aren't re-encoded.
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
    startUrls: openExample ? [EXAMPLE_URL] : undefined,
  },
  manifest: {
    // Kept ≤ 45 characters — the store limit (enforced by `web-ext lint`). The
    // hosts (GitLab & GitHub) are spelled out in the description below.
    name: 'Git Diagram Viewer – BPMN & DMN',
    description:
      'Render BPMN & DMN diagrams inline on GitLab & GitHub and show a visual before/after diff in merge/pull requests. Includes a standalone diagram viewer.',
    permissions: [
      // scripting: register content scripts on self-hosted instances at runtime.
      'scripting',
      // storage: persist the user's self-hosted host list.
      'storage',
      // contextMenus + activeTab: the right-click "Enable on this domain" toggle
      // and the one-click toolbar-icon enable for the current site.
      'contextMenus',
      'activeTab',
    ],
    // Clickable toolbar icon (no popup) — one-click enable on the current site.
    // Icons themselves are auto-detected from public/icon/*.png into `icons`;
    // point the toolbar action at the same set so it renders crisply per size.
    action: {
      default_icon: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '128': 'icon/128.png',
      },
    },
    // Fixed hosts for the public SaaS instances. raw.githubusercontent.com is the
    // redirect target of github.com's raw route; api.github.com serves the
    // pull-request metadata (base/head SHAs, changed files) for the PR diff.
    host_permissions: [
      'https://gitlab.com/*',
      'https://github.com/*',
      'https://raw.githubusercontent.com/*',
      'https://api.github.com/*',
    ],
    // Self-hosted GitLab EE / GitHub Enterprise: granted per-domain by the user
    // (right-click toggle, toolbar icon, or options page) — never up front.
    optional_host_permissions: ['*://*/*'],
    browser_specific_settings: {
      gecko: { id: 'git-diagram-viewer@emaarco.github.io' },
    },
  },
})
