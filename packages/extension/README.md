# `@bpmn-io-browser-plugin/extension`

> The browser extension (Chrome, Edge, Firefox) — renders **BPMN & DMN inline**
> on GitLab & GitHub and shows a **before/after diff** in pull/merge requests.

## Why

A process change should be reviewed as a _diagram_, not as a wall of
`<bpmn:sequenceFlow>`. This is the front-end that puts the real model back where
the review happens: on the file page and in the PR/MR — no downloads, no context
switch to a modeler.

It's the primary delivery path for the [`core`](../core) diff engine, wrapped in
[bpmn-js / dmn-js](https://bpmn.io) for rendering and built with
[WXT](https://wxt.dev) so one codebase ships to Chromium **and** Firefox.

## What's inside

- **`entrypoints/*.content.ts`** — content scripts per surface: file (blob)
  viewer and PR/MR diff, for GitHub and GitLab.
- **`entrypoints/background.ts`** — fetches file contents from the host you're
  viewing and manages per-domain permissions (self-hosted GitLab/GitHub).
- **`entrypoints/options` + `viewer`** — the options page and a standalone
  drop-in viewer (nothing leaves your machine).
- **`src/`** — platform adapters (`platforms/`), diagram kinds (`kinds/`),
  themed viewer, and the diff overlay/markers.

## Develop

```bash
npm run dev                # hot-reload in Chromium
npm run dev -- -b firefox  # …in Firefox
npm run dev:example        # …and open the git-host views on our own fixtures
npm run build              # production build for both browsers
```

`npm run dev:example` opens three tabs against this repo so the git-host views
can be checked end-to-end without foreign repos: the inline viewer on
`e2e/fixtures/sample.bpmn` and `sample.dmn`, and the before/after diff on a
permanently-closed demo PR ([#12](https://github.com/emaarco/bpmn-io-browser-plugin/pull/12)).
The tab list lives in [`wxt.config.ts`](./wxt.config.ts) (`EXAMPLE_URLS`).

Loading the built extension unpacked and the full monorepo layout are covered in
[CONTRIBUTING.md](../../CONTRIBUTING.md).
