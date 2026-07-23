# Future Plans

## Done (v2.0 / v2.1)

- [x] Bun-only package manager (removed npm/yarn/pnpm)
- [x] Color system rewrite (Pasture green + Slate neutral palette)
- [x] Documentation refresh (architecture, design, guides)
- [x] Component extraction from large files (22 files from EventsPanel, HealthPanel, SalesPanel, BreedingPanel)
- [x] Tab consolidation (14 individual tabs → 4 groups: Herd, Ops, Intel, Settings)
- [x] Feature merges (Smart Scanner → Scan tab, Reports → Analytics, Pedigree → Breeding)
- [x] Admin portal (Dashboard, Users CRUD, Tiers management)
- [x] Admin API (7 REST endpoints for stats, users, tiers)
- [x] ML service migration (Render → Fly.io — always-on, 1GB RAM)
- [x] Login UX fixes (password visibility toggle, email field label)
- [x] Database tiers table (Free/Basic/Pro seed data)
- [x] Infrastructure configs (Oracle Cloud, Fly.io, Koyeb deployment files)

## Now (v2.1 — current)

- Admin panel improvements (audit logs, activity timeline)
- Smart scan embedding page (handle missing `goat_embeddings` table)
- ML model fine-tuning trigger from admin panel
- Email notifications for important events (kidding alerts, health reminders)

## Next (v2.2)

- Prisma ORM migration (replace raw SQL queries)
- JWT-based admin auth (replace localStorage hack)
- Billing / subscription management integration
- Advanced analytics dashboard (charts, export, trends)
- Push notifications (mobile-friendly)

## Later (v3.0)

- Mobile app (React Native / Flutter)
- Multi-farm management (super-admin view across farms)
- Public marketplace for goat genetics / breeding stock
- IoT integration (smart scales, automated milk recording)
- AI-powered health predictions (mastitis, parasites)

## Out of scope

- Real-time multi-user collaboration (Google Docs–style)
- Blockchain / NFT integration
- Crypto payments