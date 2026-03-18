# Changelog — SMSOK Clone

## v1.0.0 (2026-03-18)

### Features
- SMS campaign management (create, send, schedule)
- Contact & group management with tags
- Sender name registration & approval flow
- Package tiers & credit system
- Order management with slip upload + EasySlip verification
- Dashboard with summary statistics
- API v1 endpoints for external integrations
- API key management
- Admin user management & roles
- Notification preferences
- Message templates
- Support ticket system
- Webhook integrations
- Short link tracking with click events
- PDPA consent management
- Auto top-up settings
- Tax documents & invoicing

### Security
- Credential re-audit (6 rounds) — all hardcoded secrets removed
- XSS sanitization on all inputs
- CORS + security headers hardening
- Admin JWT authentication
- Password policy enforcement

### Infrastructure
- Health check endpoint (DB + Redis)
- Production logging
- Docker Compose production config
- CI/CD with GitHub Actions + Playwright E2E
- Database indexes for performance

### Bug Fixes
- Prisma schema alignment & migration fixes
- Sidebar navigation fixes
- Skeleton loading states
- API 500 error fixes (orders, senders, tickets)
- TypeScript strict mode compliance
