# `@git-diagram-viewer/bot`

> **Spike** — a server-side BPMN diff report for pull/merge requests, built on
> [`core`](../core). Install-free, team-wide, mobile-friendly.

## Why

The [extension](../extension) is great, but it only helps people who install it.
A reviewer on their phone, an occasional approver, or a whole team that never
set it up still sees the raw XML.

This explores the other delivery path: run the **same** [`core`](../core) diff
on the server and post the **added / removed / changed / moved** summary straight
into the PR/MR. Nothing to install, everyone gets it, and it reads fine on
mobile — one diff engine, a second front-end. It's an experiment, not a shipped
product yet.

## Try it

```bash
npm run diff -w @git-diagram-viewer/bot -- <old.bpmn> <new.bpmn>
```

## What's inside

- **`src/cli.ts`** — entry point; diffs two `.bpmn` files via `core`.
- **`src/formatReport.ts`** — renders the `core` report as a shareable summary.
