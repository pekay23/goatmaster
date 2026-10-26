# GoatMaster implementation and verification

This delivery improves the marketing site, administrator portal, tenant application, database isolation, billing processing, offline records, and recognition service. Sample data is explicitly labeled and separated from default operational metrics.

## Marketing

- Editorial cream, forest, and ochre design, responsive navigation, locally hosted photographs, and progressive scroll reveals that respect reduced motion.
- Real pricing and feature limits from the administrator-managed public tier catalogue. Selection stays visible and continues into signup.
- Interactive read-only sample farms at `/demo`, clearly distinguished from customer records.
- GoatMaster branding, corrected legal billing and scan descriptions, and the demo in the sitemap. Unsupported testimonials and performance claims remain removed.

## Tenant application

- A daily work dashboard derived from actual health, breeding, events, and inventory records.
- Searchable, paginated, responsive herd, health, breeding, supplies, events, weight, and milk views with dedicated create/detail/edit screens.
- Animal history and contextual record actions; batch health and measurement entry in one atomic transaction with retry protection.
- Account-scoped drafts and IndexedDB, offline filters and queued changes, visible sync errors and conflict review, optimistic record versions, deletion markers, and incremental synchronization.
- Profile, password, billing, storage, and sign-out controls that perform real actions. Installed-app launch routes and shortcuts point to current pages.

## Administrator portal

- Operational metrics, farm directories and workspaces, membership and usage views, billing records and delivery failures, searchable navigation, audit history and before/after values.
- Server-enforced support, billing, administrator, and super-administrator capabilities. Restricted actions reflect permissions in the interface.
- Organization-scoped plan overrides with required reasons, transactional history, and audit records. Users inherit their organization's plan.
- Organization and user management with server validation, role-change session revocation, owner-transfer requirements, and last-administrator protection.
- Bounded audit exports with spreadsheet formula protection and validated filters.

## Backend and operations

- Restricted application database role, forced RLS on 29 tables, and verified denial across tenant boundaries. Request identity is transaction-local for transaction-pooling connections.
- Live user/session/membership validation, durable authentication throttling, CSRF checks, input validation, hashed support tokens, and isolated service-worker caching.
- Transactional, idempotent billing delivery processing, server-checkout matching, subscription resolution, recurring-payment matching, replay, and amount/currency checks.
- Idempotent reminder generation and a secret-protected scheduled endpoint. Explicit migrations and seeds; build/type/lint/regression CI gates.
- Consistent 128-dimensional recognition embeddings, shared versioned model and checkpoint, protected HTTP aliases and gRPC, organization-scoped scan lookup, and bounded projection training.

## Verification commands and artifacts

- `bun run lint` uses zero-warning enforcement.
- `bun run test` exercises permissions, dates, record validation, vector clocks, billing envelopes, and token expiry.
- `bun run typecheck` generates current route types before checking the project.
- `bun run build` validates production output in `.next-build`.
- `bun run db:rls` verifies 29 forced-RLS tables and cross-organization denial using the restricted role.
- `bun run verify:e2e` exercises public pages, mobile layouts, pricing, demo interactions, real sign-in, tenant screens and mutations, batch records, offline cache/drafts, sync conflicts/deletions, admin workspaces/forms, permissions, forged billing deliveries, and revoked sessions. Results and screenshots: `.verification/e2e/`.
- `bun scripts/verify-billing.ts` runs processor integration fixtures against a temporary sample organization, including renewal and rejected amounts, then removes the fixture records. It never calls the payment provider.
- `python scripts/verify-ml.py` runs real CPU inference and synthetic projection training with isolated database fixtures, including HTTP/gRPC organization query checks. Use an environment containing `ml_service/requirements.txt`.
- Three sample farms and platform test accounts are seeded. Credentials are local-only in ignored `.verification/sample-credentials.json`.

## External validation boundaries

Local environment changes do not update hosting settings. Deploy the restricted `APP_DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET`, recognition service configuration, and payment-provider configuration to each intended environment using the deployment runbook. Validate a real provider test-mode payment/webhook and the deployed recognition service after deployment. The recognition tests verify execution and compatibility; they do not establish field accuracy or promise reliable identification without real enrolled-animal evaluation.

## Verified results (26 October 2026)

- Production build completed and generated 82 pages; route type generation and TypeScript checks passed.
- ESLint passed with zero warnings. All 12 regression tests passed (28 assertions).
- All 20 browser workflow checks passed with no unhandled browser runtime errors.
- All 29 secured tables passed forced-RLS and cross-tenant isolation verification.
- Billing processor integration fixtures and all four recognition verification groups passed.
- All 19 icon, manifest, font, and offline asset URLs returned HTTP 200. Real font loading, desktop/mobile overflow checks, service-worker activation, cached install assets, and offline navigation fallback passed.
- The repeated favicon 404 was fixed in metadata; compatibility SVG and Apple icon paths are available for cached pages. Missing service-worker precache and notification assets were corrected.
- At final verification, GoatMaster development ran on port 3001. Port 3000 belonged to another local project; no changes were made to that project.

## LAN signup origin fix

The signup guard compared the browser Origin with Next.js's normalized localhost URL and rejected legitimate requests to `http://192.168.8.202:3001`. It now compares the origin to the actual request Host and protocol, preserving exact port/scheme matching and cross-site denial. Forwarded-host headers do not grant origin access.

Verified real browser signup over the LAN address, authenticated session persistence, Basic-plan continuation into billing without granting a paid plan, and rejection of foreign/wrong-port origins. Four targeted origin regressions bring the test suite to 16 passing tests (39 assertions). Lint, typecheck, and production build pass.
