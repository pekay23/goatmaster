# Future plans

Living roadmap. Tiers: **Now**, **Next**, **Later**.

## Now (v2.1)

- Email verification on signup
- Password reset flow
- 2FA / TOTP for admin accounts
- CI: GitHub Actions running `bun run lint && bun run build`
- Vercel preview deployments on every PR
- Move Cloudinary upload behind a signed API route
- Add `prefers-reduced-motion` opt-out
- `audit_log` table for mutations
- GDPR data-export endpoint

## Next (v2.2)

- Multi-user shared herds (collaboration roles: owner / editor / viewer)
- Mobile push notifications (PWA + Web Push)
- Per-goat weight chart (Chart.js)
- Health-event timeline + reminders
- Breed classifier (separate YOLO model on the server)

## Later (v3.0)

- Native iOS / Android wrapper via Capacitor
- Offline-first: full IndexedDB mirror + service worker
- Bulk import via CSV
- Open API + Zapier integration
- Herd analytics: kidding rates, weight gain, breed distribution
- Marketplace: list goats for sale with public read-only profile

## Out of scope (deliberate)

- Blockchain goat passports — fun, but not requested
- E-commerce checkout — punt to marketplace work
- Real-time video streaming of the herd — bandwidth-prohibitive
