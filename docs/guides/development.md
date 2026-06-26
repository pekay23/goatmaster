# Development Guide

## Local workflow

```bash
bun dev          # Next.js with Turbopack
# edit anything under app/ or components/
# state is preserved (HMR)
```

## Project layout

```
goatmaster/
├── app/                Next.js App Router (page.jsx is the only public page)
├── components/         All client components
├── lib/                client-side helpers (breeds.js, localDb.js)
├── public/             PWA assets
├── ml_service/         Python FastAPI microservice
├── scripts/            one-off Python scripts (model conversion, dataset prep)
└── docs/               ← you are here
```

## Adding a new tab

1. Add the tab object to `NAV_TABS` in `components/MainApp.jsx`
2. Add a `case` in the `activeTab === '…'` switch inside `<main>`
3. Build the new component in `components/`
4. Add the tab's icon to the Lucide import

## Adding a new API route

```bash
mkdir -p app/api/<feature>
# create route.js
```

Every route is a Next.js App Router handler:

```js
// app/api/<feature>/route.js
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { pgPool } from '@/lib/db';

async function requireUser() {
  const token = cookies().get('gm_session')?.value;
  if (!token) return null;
  const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
  return payload;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { rows } = await pgPool.query('SELECT * FROM goats WHERE owner_id = $1', [user.sub]);
  return Response.json(rows);
}
```

## Linting

```bash
bun run lint
```

## Building

```bash
bun run build    # production build
bun start        # serve the build
```

## Conventions

- Server state via `fetch` + `useEffect`. No SWR / React Query (kept dependency count low).
- Mutations refresh the affected list with a manual `fetchGoats()` re-call.
- Loading state: skeletons in `components/MainApp.jsx`.
- Error state: `<ErrorBoundary>` around risky scanners; `showToast('…', 'error')` for inline.
- All JSX imports from `@/lib/…`, `@/components/…` (see `jsconfig.json`).

## Code style

- Indent: 2 spaces
- Quotes: single
- Semicolons: none
- Trailing commas: never
- React imports: `import { useState } from 'react'` (named)
- Style: prefer CSS classes (defined in `app/globals.css`) over inline `style={…}` for repeated patterns
