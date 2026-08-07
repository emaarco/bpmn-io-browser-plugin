# `@git-diagram-viewer/extension`

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
npm run build              # production build for both browsers
```

Loading the built extension unpacked and the full monorepo layout are covered in
[CONTRIBUTING.md](../../CONTRIBUTING.md).
