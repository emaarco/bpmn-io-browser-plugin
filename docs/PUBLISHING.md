# Publishing to the stores

Releases are automated with [release-please](https://github.com/googleapis/release-please):
merges to `main` with Conventional-Commit messages open/maintain a release PR that
bumps `packages/extension/package.json` and updates `CHANGELOG.md`. Merging that PR
tags the release and the `Release` workflow builds and attaches the store bundles
(`packages/extension/.output/*.zip`) to the GitHub release.

Uploading those bundles to the stores needs credentials and is therefore a manual
(or separately secret-gated) step. Recommended tooling — pin the versions:

## Chrome Web Store / Edge Add-ons

- One-time: register a developer account (Chrome: $5 one-off; Edge: free) and
  create the item to obtain its ID.
- Chrome: `npx chrome-webstore-upload-cli@3 upload --source <chrome.zip> \
--extension-id $CHROME_ID --client-id $CHROME_CLIENT_ID \
--client-secret $CHROME_CLIENT_SECRET --refresh-token $CHROME_REFRESH_TOKEN --auto-publish`
- Edge: use the Microsoft Partner Center API (or the `wdzeng/edge-addon` action,
  SHA-pinned) with your product ID and API keys.

## Firefox Add-ons (AMO)

- One-time: create an AMO account and API credentials.
- `npx --package=web-ext@10 web-ext sign --channel listed \
--source-dir packages/extension/.output/firefox-mv3 \
--api-key $AMO_JWT_ISSUER --api-secret $AMO_JWT_SECRET`

## Store listing assets (prepare once)

- Icons: 16, 32, 48, 128 px (add a source at `packages/extension/public/icon/` and
  wire up `@wxt-dev/auto-icons`, or provide the PNGs directly).
- Screenshots of the inline viewer, the MR diff, and the standalone viewer.
- Short + long description, category **Developer Tools**, and the privacy policy
  (link to `PRIVACY.md`). Be ready to justify the `optional_host_permissions` /
  self-hosted flow to reviewers: it is only requested per-domain, on user action.

Store secrets should live in a protected GitHub **Environment** with required
reviewers before you wire auto-publish into the `Release` workflow.
