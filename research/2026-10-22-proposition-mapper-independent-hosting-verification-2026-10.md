---
date: "2026-10-22"
status: "checked-awaiting-independent-review"
title: "Proposition Mapper independent hosting verification 2026-10-22"
kind: "evidence"
created: "2026-10-22T19:31:16Z"
project: "/Users/dominiklukes/gitrepos/07_webapps-websites/07_demos-and-explainers/Proposition-Mapper"
sources:
  - file: docs/checkpoint-proposition-mapper-independent-hosting.md
artefact: "research/independent-hosting-evidence/proposition-desktop.png"
---

# Plan

- Actual browser entry: index.html → index.tsx → root App.tsx. The separate src/App.tsx is an unused historical copy with unresolved local imports; preserve it, exclude it from the live application's typecheck.
- Preserve prompts and term/relationship extraction, map/list/KWIC views, manual editing, study and history import/export.
- Visitor key in memory; explicit clear. Lazy Gemini client with no owner environment key. Abort stale requests and reject a later pipeline stage after key changes.
- Bundle dependencies and existing Tailwind styling locally. Credential-free static dist build; no deployment.
- Test missing keys, visitor headers, two-stage extraction, cancellation between stages and safe provider errors. Browser-check keyless data and mocked graph generation. Commit and push the checked result.

# Validation

- Four focused Node tests passed: missing key, two-stage visitor requests, clear between stages, safe provider errors. TypeScript and static production build passed.
- Isolated Chromium browser: no-key mount, three mocked Gemini calls, graph rendering, clear, keyless history and JSON import/export, desktop/mobile, zero page errors. No real API requests.
- Production dependency audit: zero known vulnerabilities. Seven development advisories remain in the Tailwind 3 chain (5 high, 2 moderate). Bundle-size warning remains.
- Existing source prompts and model choice preserved. Live provider/CORS behaviour is unverified. No deployment or Cloud Run change.
- Browser evidence: research/independent-hosting-evidence/. Build output for later static publication: dist/.

# Recovery

Branch feat/independent-own-key-web. Run npm ci, npm test, npm run typecheck, npm run build. Root App.tsx is the actual entry. src/App.tsx remains an unused historical copy. Keys are memory-only, never included in graph history or exports.
