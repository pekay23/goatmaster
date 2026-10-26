# Deployment

The Next.js application serves marketing, tenant, and administrator routes. The Python recognition service is deployed separately. Deployment must use the same schema and generated protocol files as this checkout.

## Required configuration

- `APP_DATABASE_URL`: restricted PostgreSQL application role without SUPERUSER or BYPASSRLS. Used by Next.js and the ML service.
- `DATABASE_URL` or `MIGRATIONS_DATABASE_URL`: database owner connection for explicit migration commands. Keep this out of the application runtime where possible.
- `JWT_SECRET`: long random session-signing secret.
- `NEXT_PUBLIC_APP_URL`: canonical HTTPS application origin.
- `ML_SERVICE_URL`, `ML_SERVICE_KEY`: recognition service address and shared authentication secret. An absent key denies requests.
- `PAYSTACK_SECRET_KEY` and a monthly Paystack plan code for each paid tier: required for paid checkout. Set plan codes from the administrator tier editor at `/admin/tiers`. The webhook verifies Paystack HMAC signatures using the secret key.
- `NEXT_PUBLIC_BILLING_SUPPORT_EMAIL` and `NEXT_PUBLIC_BILLING_SUPPORT_PHONE`: optional public contact details shown with payment options on the marketing and tenant plan pages. Set these before building if customers should see support contacts.
- `CRON_SECRET`: required for the scheduled reminder endpoint. Vercel sends it as a bearer token.
- Cloudinary public configuration is needed only when enabling direct image uploads.

Set values separately for preview and production. Local environment files are ignored and do not update hosting configuration automatically.

Paid checkout requests Paystack channels for card, mobile money, bank transfer, and USSD. The methods actually offered are determined by the Paystack merchant account and checkout. Annual checkout remains unavailable until annual prices are configured.

## Database preparation

Run with the owner connection available in a trusted maintenance environment:

```sh
bun run db:migrate
bun run db:rls
```

Migrations are explicit. Installation and builds do not run migrations or seed administrators. There is no public migration endpoint. Create the initial administrator with `bun run db:seed:admin` and the requested administrator credentials supplied through environment variables.

`db:rls` verifies forced RLS on all 29 secured tables, a restricted application role, cross-organization denial, and administrator visibility. Runtime identity settings are transaction-local so they work with transaction-pooling database endpoints.

## Validation

```sh
bun install --frozen-lockfile
bun run lint
bun run test
bun run typecheck
bun run build
```

Production output is `.next-build`; development uses `.next`. Start a local production instance on port 3317 with `bun run start --port 3317`.

For sample-data integration verification, run `bun run db:seed:sample`, then `bun run verify:e2e`. The seed creates three explicitly marked sample organizations and test accounts. Their credentials are stored in ignored `.verification/sample-credentials.json`; do not publish that file. Sample organizations are excluded from administrator operational metrics by default. Run these mutating verifications only against an intended test environment.

## Recognition service

Generate contracts with `bun run proto:gen:py`. Install `ml_service/requirements.txt` in an isolated Python environment and start `uvicorn main:app --host 0.0.0.0 --port 8080` from `ml_service`.

Use HTTPS for external traffic. Keep training and enrollment endpoints behind `ML_SERVICE_KEY`. Verify service readiness, authenticated embedding, organization-scoped scans, and model/checkpoint compatibility before enabling the feature. The fallback detector and similarity scores do not establish identification accuracy; review results against real enrolled animals.

## After deployment

Verify public pricing, tenant sign-in, cross-tenant access denial, administrator role restrictions, and a provider test-mode payment plus signed webhook. Confirm the scheduled reminder job runs with the configured bearer secret. Monitor application/database errors and failed webhook deliveries. Retain a database backup before schema changes; roll application deployment back only to a schema-compatible release.
