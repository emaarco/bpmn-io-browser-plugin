# `@git-diagram-viewer/core`

> The diff engine — framework-free BPMN parsing and a **semantic** diff.
> No DOM, no bpmn-js viewer, no browser.

## Why

Comparing two `.bpmn` files as text tells you nothing useful: reformatting,
reordered XML, or a moved element all look like huge changes, while a renamed
task hides in the noise. The hard part of this project isn't drawing the
diagram — it's answering _"what actually changed in the process?"_

That logic lives here, deliberately isolated from any UI. Because `core` has no
DOM and no viewer dependency, it runs and unit-tests in plain Node, and feeds
**both** delivery paths — the [extension](../extension) and the
[bot](../bot) — from one engine. Same diff, two front-ends.

## What's inside

- **`adapter/parseBpmn`** — turns BPMN XML into a plain model via `bpmn-moddle`.
- **`domain/model` + `signature`** — a stable, layout-independent signature per
  element, so noise (formatting, order) is ignored and real edits stand out.
- **`domain/diff`** — classifies every element as **added / removed / changed /
  moved**, including `zeebe:*` properties.
- **`domain/report`** — the structured result both front-ends render.

## Usage

Consumed as a workspace dependency (`@git-diagram-viewer/core`); import the diff
from `src/index.ts`. See the repo [README](../../README.md) for the full picture.
