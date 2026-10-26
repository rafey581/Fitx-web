# HTTP acceptance harnesses

These scripts drive the **real** Next.js server actions over HTTP against a
running production build. They are the end-to-end layer of the test strategy
(the unit layer is `npm test` at the repo root). Each harness creates its own
throwaway rows, asserts behaviour, and cleans up so the database is left as it
was found.

| Script | Phase | Covers | Result |
| --- | --- | --- | --- |
| `accept2.mjs` | Phase 4 | content modules CRUD, module-driven blocks, contact form + leads inbox, CSV export | 43/43 |
| `accept5.mjs` | Phase 5 | SEO routes + JSON-LD, starter pages, `timetable` / `contact-info` blocks | 35/35 |
| `accept6.mjs` | Phase 6 | a11y chrome, JSON-LD serialiser, admin boundary, CSV BOM + formula-injection guard | 18/18 |
| `accept7.mjs` | Phase 7 | the client handover checklist (edit text, image, section, page, trainer, leads) | 23/23 |

## Prerequisites

1. A migrated, seeded database (`npm run db:migrate` + `npm run db:seed`).
2. A production build and server:
   ```bash
   npm run build
   npm start          # serves http://localhost:3000
   ```
3. For `accept7.mjs`, the local MySQL CLI (used only to resolve the ids of its
   own rows for cleanup). Override with environment variables if needed:
   - `FITX_BASE_URL` (default `http://localhost:3000`)
   - `FITX_MYSQL_BIN` (default the Windows MySQL 8.4 path)
   - `FITX_MYSQL_ARGS` (default `-uroot -pFitxDev!2026 fitx`)

Run a harness with Node, e.g.:

```bash
node tests/acceptance/accept7.mjs
```

## Action ids are resolved automatically

Server-action ids are content-hashed and change whenever an action's source
changes. Rather than hard-code them, every harness imports
`actionIds(...)` from [`action-ids.mjs`](./action-ids.mjs), which reads the
`exportedName -> id` map from the manifests `next build` emits
(`.next/server/**/server-reference-manifest.json`). **Always run `npm run build`
before the harnesses**, or the ids will be stale/missing and the resolver will
throw a clear error.

## Notes

- The harnesses use the development owner credentials (`owner@fitx.pk` / the
  seed password — see `.env.example`). Adjust `src/server/actions/auth` login
  values inside each script for another environment.
- `accept2.mjs` is idempotent: it skips creating the `usman-ali` trainer and the
  `ali.raza` lead if they already exist, and only removes the rows it created.
- These are **not** part of `npm test`; they need a running server.
