---
title: propositionmapper Cloudflare Pages preview deployment
date: 2026-11-19
register: FOR AGENTS
---

# Pages preview

Project: `propositionmapper` (account `b6ae5bced06492ee6f0c8f92776804da`). Preview: https://propositionmapper.pages.dev/ . Production canonical and citation URL: https://propositionmapper.edutools.fyi/ .

This phase uses the Pages project without custom domains. DNS and the existing Cloud Run services remain unchanged. Do not attach domains or switch addresses before Dominik approves the preview list.

```sh
npm ci
npm run build
env -u CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID=b6ae5bced06492ee6f0c8f92776804da npx wrangler@4 pages deploy dist --project-name=propositionmapper --branch=main
node ~/gitrepos/_SKILLS/skills/dev/web-design-elements/kit/check-citation.mjs https://propositionmapper.pages.dev/
```

Wrangler uses its existing OAuth session. Never inject an owner API key into this browser build. The preview build deliberately defines the legacy owner-key variables as empty strings; AI features requiring them need a server and are not repaired in this phase.

The cited source constructs its AI client during module loading. Without an owner key, that blocks the whole app at startup. This preview records the limitation; repair of AI runtime behaviour is outside the phase-1 mechanical build scope.
