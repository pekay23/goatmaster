# Known Issues

Living list of persistent issues + workarounds. Newest at the top.

## 2026-06-05 — `prefers-reduced-motion` not honoured

**Severity:** low (accessibility nice-to-have)
**Workaround:** all animations are already < 600 ms, so the impact is minimal.
**Fix planned for:** v2.1 — add a global `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }` block.

## 2026-06-05 — No CI

**Severity:** medium
**Workaround:** run `bun run lint && bun run build` locally before opening a PR.
**Fix planned for:** v2.1 — GitHub Actions workflow with `bun install && bun run lint && bun run build`.

## 2026-06-05 — No password reset / email verification

**Severity:** high (security)
**Workaround:** admin can hard-delete and re-create accounts; users can change password via direct DB write (admin only).
**Fix planned for:** v2.1 — full password reset flow + email verification gate before login. See [security model § 7](../architecture/security-model.md#7-whats-not-in-v20-planned-for-v21).

## 2026-06-05 — ML service cold start

**Severity:** low
**Symptom:** first request after the HF Space sleeps returns 4–6 s
**Workaround:** show a "Warming up ML service…" toast in the scanner
**Fix planned for:** v2.1 — pin HF Space to a paid instance (always-on)

## 2026-06-05 — Cloudinary unsigned preset allows anyone to upload

**Severity:** medium (abuse vector)
**Workaround:** preset is rate-limited at the Cloudinary dashboard; quota is shared across all users.
**Fix planned for:** v2.1 — move uploads through a signed API route that validates auth + size.

## 2026-05-30 — Vercel serverless 10 s timeout

**Severity:** low
**Symptom:** long smart-scan batches (>30 images) can be cut off
**Workaround:** SmartScanner caps batch at 20 by default
**Fix planned for:** v2.1 — break into smaller batches server-side, return a job id, poll for completion.
