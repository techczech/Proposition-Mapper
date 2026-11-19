---
title: proposition-mapper Workers preview deployment
date: 2026-11-19
register: FOR AGENTS
---

# Workers static-asset preview

Worker: `proposition-mapper`. Preview: https://proposition-mapper.czechly.workers.dev/
Production canonical and citation URL: https://propositionmapper.edutools.fyi/
Branch: `deploy/pages-preview-batch-b`. Build output: `dist/`.

The Worker name was confirmed unused before creation. Pages project creation was blocked by the account's 100-project quota. This is a separate workers.dev preview; existing Pages projects and Workers are preserved. DNS, custom domains and Cloud Run remain unchanged.

From this branch, without build secrets:

```sh
npm ci
npm run build
env -u CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID=b6ae5bced06492ee6f0c8f92776804da npx wrangler@4 deploy
```

`wrangler.jsonc` serves only static build assets with SPA navigation fallback, `workers_dev: true`, and no routes or custom domains. Vite's key replacements are empty strings; no owner key is included.

AI feature needs a server: yes. The static preview supplies no server-held key.

Earlier build fixes and source comparison are recorded in the preceding commits on this branch.
