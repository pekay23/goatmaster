// ESLint flat config for Goat Master.
// Composition:
//   1. `eslint-config-next/core-web-vitals` — Next/React/Core-Web-Vitals rules
//   2. Project-specific rule overrides and ignore patterns
//
// Note: Next.js 16 removed the `next lint` command, so lint is run directly
// via `eslint .`. Script: `bun run lint`.

import { defineConfig, globalIgnores } from 'eslint/config'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  // ── Global ignores ─────────────────────────────────────────────────────────
  // ESLint flat config does NOT honour .gitignore or .eslintignore, so
  // everything hidden from the linter must be listed here.
  globalIgnores([
    // Next.js build output
    '.next/**',
    'next-env.d.ts',
    'out/**',
    // Vercel deployment helpers
    '.vercel/**',
    // Test / coverage artefacts
    'coverage/**',
    'test-results/**',
    // Editor / agent / IDE / VCS metadata
    '.git/**',
    '.github/**',
    '.vscode/**',
    '.cursor/**',
    '.claude/**',
    '.agents/**',
    '.kilo/**',
    '.codegraph/**',
    // Dependencies
    'node_modules/**',
  ]),

  // ── Next + Core Web Vitals ─────────────────────────────────────────────────
  ...nextCoreWebVitals,

  // ── Project-specific overrides ─────────────────────────────────────────────
  {
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
])
