# Contributing

Thanks for helping improve the bpmn-io-browser-plugin extension!

## Getting started

```bash
npm install
npm run dev            # live-reload the extension in Chrome
```

This opens a browser with the extension pre-loaded and hot-reloads on every
change. For Firefox:

```bash
npm run dev -w @bpmn-io-browser-plugin/extension -- -b firefox
```

## Repository layout

This is an npm-workspaces monorepo:

| Package              | What it is                                                                  |
| -------------------- | --------------------------------------------------------------------------- |
| `packages/core`      | Framework-free BPMN parsing (bpmn-moddle) + the semantic diff. No DOM.      |
| `packages/extension` | The [WXT](https://wxt.dev) extension: content scripts, options, background. |

The diff is deliberately isolated in `core` so it is unit-tested in plain Node,
independently of the extension that renders it.

## Development

```bash
# quality gates
npm test               # unit + DOM-component tests (vitest)
npm run typecheck
npm run lint
npm run lint:deps      # architecture guardrail (dependency-cruiser)
npm run knip           # unused files, exports & dependencies (knip)

# production build (both browsers) + zips
npm run build -w @bpmn-io-browser-plugin/extension
npm run zip   -w @bpmn-io-browser-plugin/extension
```

## End-to-end tests

`npm test` covers the pure logic (Node) and the injection DOM helpers (happy-dom).
On top of that, one [WebdriverIO](https://webdriver.io) suite loads the **real
built extension** into a browser and runs the same specs on **Chrome, Edge and
Firefox** (`packages/extension/e2e`). It serves GitHub-shaped fixture pages from a
local server — no live github.com — and asserts the diagram actually renders.

```bash
# 1. build the extension in E2E mode (its content scripts also match localhost)
npm run e2e:build -w @bpmn-io-browser-plugin/extension
# 2. run the suite (defaults to every browser that's installed)
npm run test:e2e  -w @bpmn-io-browser-plugin/extension
```

Pick a subset of browsers, or **see it run**:

```bash
WDIO_BROWSERS=chrome npm run test:e2e -w @bpmn-io-browser-plugin/extension  # just one browser
WDIO_HEADED=1        npm run test:e2e -w @bpmn-io-browser-plugin/extension  # visible browser window
WDIO_SCREENSHOTS=1   npm run test:e2e -w @bpmn-io-browser-plugin/extension  # PNG per test
```

`WDIO_HEADED=1` opens a real window (the specs run fast — drop a `browser.debug()`
into one to freeze it and look). `WDIO_SCREENSHOTS=1` writes a PNG of each test's
end state — the rendered diagram above the host DOM — to
`packages/extension/.output/e2e-screenshots/`, which works headless too and is
uploadable as a CI artifact.

> Re-run `e2e:build` after changing extension code — the suite drives the built
> `.output` extension, not your source directly. CI runs this suite per browser
> (Chrome & Edge required, Firefox soaking).

### Drift canary (real github.com)

The fixture suite tests _our_ logic against a copy of GitHub's DOM, so it can't
notice GitHub changing its real markup. A separate **canary** covers that: it
loads the extension against the real `dev:example` pages and checks the diagram
still injects. Every GitHub selector lives in one file per host
(`src/platforms/github.selectors.ts`, `gitlab.selectors.ts`), so a drift fix is a
one-file change.

```bash
npm run build       -w @bpmn-io-browser-plugin/extension   # normal build (real github.com)
npm run test:e2e:live -w @bpmn-io-browser-plugin/extension # WDIO_LIVE against real github.com
```

It runs **weekly** (`.github/workflows/canary.yml`), **not** on PRs — real GitHub
is A/B-tested and occasionally flaky, so it must never block a merge. When it goes
red, GitHub changed its DOM: update the selector file (and refresh the fixtures).
A GitLab canary is a tracked follow-up.

## Loading the extension unpacked

You don't need the Chrome Web Store / AMO to run this — load the built extension
directly. Build it once (`npm run build -w @bpmn-io-browser-plugin/extension`), which
produces two artifacts:

- `packages/extension/.output/chrome-mv3` — for **all Chromium browsers**
- `packages/extension/.output/firefox-mv3` — for **Firefox and its forks**

> For active development, prefer `npm run dev` (Chromium) or
> `npm run dev -w @bpmn-io-browser-plugin/extension -- -b firefox` — it hot-reloads
> instead of requiring a rebuild + reload for each change.

### Chromium browsers (Chrome, Edge, Vivaldi, Brave, Opera, Arc, …)

They all load the **same** `chrome-mv3` folder. Open your browser's extensions
page, turn on **Developer mode**, then click **Load unpacked** and select
`packages/extension/.output/chrome-mv3`.

| Browser        | Extensions page        |
| -------------- | ---------------------- |
| Chrome         | `chrome://extensions`  |
| Edge           | `edge://extensions`    |
| Vivaldi        | `vivaldi://extensions` |
| Brave          | `brave://extensions`   |
| Opera          | `opera://extensions`   |
| Chromium / Arc | `chrome://extensions`  |

The extension stays installed across restarts. After a rebuild, hit **↻ Reload**
on the extension card to pick up changes.

### Firefox (and forks: LibreWolf, Waterfox, Zen, …)

- **Quick / temporary** (simplest, but removed when you close the browser):
  open `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** →
  select `packages/extension/.output/firefox-mv3/manifest.json`.
- **Permanent:** Firefox only installs **signed** add-ons persistently. Either
  submit the zip to [AMO](https://addons.mozilla.org) for signing, or use
  **Firefox Developer Edition / Nightly**, set `xpinstall.signatures.required` to
  `false` in `about:config`, then install the packaged zip from
  `npm run zip -w @bpmn-io-browser-plugin/extension` (`.output/*.zip`).

### After installing

`gitlab.com` and `github.com` work immediately. For a **self-hosted** GitLab EE /
GitHub Enterprise instance, open a `.bpmn` file (or a merge request) there and
click the extension's toolbar icon — or right-click the page → _Enable bpmn-io-browser-plugin on this
domain_ — to grant access to just that site. You can also
manage domains in the options page.

## Before you open a PR

Please make sure these pass:

```bash
npm test          # unit tests
npm run typecheck
npm run lint
npm run lint:deps  # architecture boundaries
npm run knip       # unused files, exports & dependencies
npm run format     # prettier
```

## Conventions

- **Commits & PR titles** follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, …). The PR title is checked in
  CI and drives the automated release notes (release-please).
- **Architecture**: keep `packages/core` free of DOM and bpmn-js — it's the pure,
  testable diff core. The layering is enforced by dependency-cruiser.
- **Dependencies** are pinned to exact versions.

## Where things live

- `packages/core/src/domain` — the diff algorithm (pure).
- `packages/core/src/adapter` — BPMN XML → parsed model (bpmn-moddle).
- `packages/extension/entrypoints` — content scripts, background, popup, options.
- `packages/extension/src/platforms` — GitLab/GitHub DOM & API adapters.
- `packages/extension/src/inject` — orchestration (shadow-root mounting, SPA nav).
- `packages/extension/src/viewer` / `src/diff` — the rendered UIs.
