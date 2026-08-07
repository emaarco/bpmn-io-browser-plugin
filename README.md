# Git Diagram Viewer

A browser extension (Chrome, Edge, Firefox) that renders **BPMN & DMN diagrams
inline** on GitLab and GitHub and shows a **visual before/after diff** in merge
and pull requests — plus a **standalone viewer** for any `.bpmn` / `.dmn` file on
your machine.

Built on the [bpmn.io](https://bpmn.io) toolkits ([bpmn-js](https://github.com/bpmn-io/bpmn-js),
[dmn-js](https://github.com/bpmn-io/dmn-js)); new formats are added through a small
diagram-kind registry. Ported from two internal Tampermonkey userscripts into a
proper, tested, store-ready extension.

## Features

- **Inline viewer** — open a `.bpmn` or `.dmn` file on GitLab or GitHub and see the
  diagram above the source (drag to pan, scroll to zoom, fit button). The diagram
  is added above the code; the code stays visible below it.
- **Merge / pull-request diff** — for every changed `.bpmn` file in a GitLab MR or
  GitHub PR, a before/after view is added above the code diff and marks
  **added / removed / changed / moved** elements (semantic diff, including
  `zeebe:*` extension properties) with prev/next navigation and a Diff/Plain
  toggle. GitHub PR metadata is read from the REST API, so on github.com this
  covers public repositories; private repos work on GitHub Enterprise (same-origin
  API).
- **Standalone viewer** — a hidden utility page (`chrome-extension://<id>/viewer.html`)
  to drop in any `.bpmn` / `.dmn` file; no site permissions needed. It is
  intentionally not a toolbar popup — the extension's focus is the inline view.
- **Self-hosted** — open a `.bpmn` file (or a merge request) on your GitLab EE /
  GitHub Enterprise instance and **click the toolbar icon** (or right-click →
  _Enable Git Diagram Viewer on this domain_) to grant access to just that site. You can
  also manage domains in the options page.

## Repository layout

This is an npm-workspaces monorepo:

| Package              | What it is                                                                              |
| -------------------- | --------------------------------------------------------------------------------------- |
| `packages/core`      | Framework-free BPMN parsing (bpmn-moddle) + the semantic diff. No DOM.                  |
| `packages/extension` | The [WXT](https://wxt.dev) extension: content scripts, options, background.             |
| `packages/bot`       | Spike: a server-side diff report (PR/MR bot) built on `core` — install-free, team-wide. |

The diff is deliberately isolated in `core` so it is unit-tested in plain Node and
feeds both the extension **and** the bot spike — same engine, two delivery paths.
Try the bot: `npm run diff -w @git-diagram-viewer/bot -- <old.bpmn> <new.bpmn>`.

## Development

```bash
npm install

# run the extension in a live browser with HMR
npm run dev            # Chrome
npm run dev -w @git-diagram-viewer/extension -- -b firefox

# quality gates
npm test               # unit tests (vitest)
npm run typecheck
npm run lint
npm run lint:deps      # architecture guardrail (dependency-cruiser)

# production build (both browsers) + zips
npm run build -w @git-diagram-viewer/extension
npm run zip   -w @git-diagram-viewer/extension
```

## Install locally (without the store)

You don't need the Chrome Web Store / AMO to run this — load the built extension
directly. First build it once:

```bash
npm install
npm run build -w @git-diagram-viewer/extension
```

This produces two artifacts:

- `packages/extension/.output/chrome-mv3` — for **all Chromium browsers**
- `packages/extension/.output/firefox-mv3` — for **Firefox and its forks**

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
  `npm run zip -w @git-diagram-viewer/extension` (`.output/*.zip`).

### After installing

`gitlab.com` and `github.com` work immediately. For a **self-hosted** GitLab /
GitHub Enterprise instance, open a `.bpmn` file (or a merge request) there and
click the extension's toolbar icon — or right-click the page → _Enable BPMN
viewer on this domain_ — to grant access to just that site.

> **Tip:** for active development use `npm run dev` (Chromium) or
> `npm run dev -w @git-diagram-viewer/extension -- -b firefox` instead — it opens a browser
> with the extension pre-loaded and hot-reloads on every change.

## Privacy

The extension collects **no data**. It only fetches file contents from the git
host you are already viewing. See [PRIVACY.md](./PRIVACY.md).

## License

[MIT](./LICENSE) © Marco Schäck
