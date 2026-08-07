# Contributing

Thanks for helping improve the BPMN Viewer & Diff extension!

## Getting started

```bash
npm install
npm run dev            # live-reload the extension in Chrome
```

Then load `packages/extension/.output/chrome-mv3` as an unpacked extension (see
the [README](./README.md#load-unpacked)).

## Before you open a PR

Please make sure these pass:

```bash
npm test          # unit tests
npm run typecheck
npm run lint
npm run lint:deps  # architecture boundaries
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
