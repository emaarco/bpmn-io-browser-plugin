# Privacy Policy

_Last updated: 2026-08-12_

**BPMN Viewer & Diff for GitLab & GitHub** does not collect, store, transmit, or
sell any personal data. There are no analytics, no tracking, and no external
servers operated by us.

## What the extension does

- It runs only on pages you grant it access to: `gitlab.com`, `github.com`,
  `raw.githubusercontent.com`, and any self-hosted instance you explicitly add in
  the options page.
- On those pages it reads the `.bpmn` file content in order to render the diagram.
  File contents are fetched **directly from the git host you are viewing**, using
  your existing browser session (so private repositories work). Nothing is sent
  anywhere else.
- The standalone viewer reads files you drop into it locally, in the browser. They
  never leave your machine.

## Storage

The data stored is kept in your browser's local extension storage and never
leaves your browser:

- the list of self-hosted instance domains you add, so the extension knows where
  to activate;
- an optional GitHub API token you enter, used only for private repositories on
  github.com. It is sent **only** to `api.github.com` (never to any other host)
  to authenticate the diff-metadata requests, and only if you choose to set one.

## Permissions

- `scripting`, `storage` — register the viewer on self-hosted instances you add,
  and remember that list.
- Host access (`gitlab.com`, `github.com`, `raw.githubusercontent.com`, plus any
  self-hosted domain you grant) — required to read and render `.bpmn` files on
  those sites. Access to other sites is only ever requested when you add them.

## Contact

Questions: open an issue on the project's GitHub repository.
