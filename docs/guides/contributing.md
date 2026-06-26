# Contributing Guide

## Branching

- `main` — always deployable
- `feat/<scope>-<short-desc>` — new feature
- `fix/<scope>-<short-desc>` — bug fix
- `chore/<scope>-<short-desc>` — maintenance
- `docs/<scope>` — docs only

## Commits

Conventional Commits:

```
feat(scanner): add torch-mode torch overlay
fix(merge): prevent merging a goat with itself
docs(colors): document sun-700 token
chore(deps): bump next to 16.2.4
```

## Pull requests

- Title format: `<type>(<scope>): <imperative summary>`
- Description must include:
  - **What** changed
  - **Why**
  - **How** to verify
  - **Screenshots / recordings** for any UI change
- At least one approval before merge
- Squash-merge to `main`

## Local checks

```bash
bun run lint
bun run build
```

CI is not yet wired up — please run both locally before opening a PR.

## Style

- 2-space indent, single quotes, no semicolons, no trailing commas
- See `docs/guides/development.md` for the full conventions
- For UI changes, update `docs/design/` and add a screenshot to the PR

## Releases

1. Bump `version` in `package.json`
2. Append a section to `docs/CHANGELOG.md`
3. Tag: `git tag v2.x.y && git push --tags`
4. Vercel auto-deploys from the tag's commit
