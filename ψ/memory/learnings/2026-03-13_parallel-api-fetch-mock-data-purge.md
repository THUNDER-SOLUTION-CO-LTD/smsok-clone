# Lesson: Parallel API Fetching & Mock Data Purge Patterns

**Date**: 2026-03-13
**Context**: SMSOK Clone mock data elimination across 12+ files

## Pattern: Promise.allSettled for Graceful Degradation

When a page needs data from multiple independent APIs, use `Promise.allSettled` instead of `Promise.all`:

```tsx
const [creditsRes, packagesRes, bankRes] = await Promise.allSettled([
  fetch("/api/v1/credits"),
  fetch("/api/v1/packages"),
  fetch("/api/v1/payments/bank-account"),
]);

// Each result handled independently — one failure doesn't crash others
if (creditsRes.status === "fulfilled" && creditsRes.value.ok) { ... }
if (packagesRes.status === "fulfilled" && packagesRes.value.ok) { ... }
```

## Pattern: Empty State > Mock Data

When API is unavailable:
- Show loading spinner during fetch
- Show error with retry button on failure
- Show beautiful empty state when data is genuinely empty
- NEVER show hardcoded placeholder data

## Anti-pattern: Scattered Mock Constants

Mock data scattered across files (MOCK_BANK_ACCOUNT in types, PRESET_AMOUNTS in component, MOCK_WEBHOOKS in page) is impossible to audit. If you must use seed data during development, put it in ONE file clearly named `__dev_seeds.ts` and import everywhere — easy to find, easy to delete.

## Audit Grep for Mock Data

```bash
grep -rn "MOCK_\|generateMock\|mock\|hardcode\|placeholder\|dummy\|fake\|seed" --include="*.tsx" --include="*.ts" app/
```
