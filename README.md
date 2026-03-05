# Bite Creole Backend (NestJS + Prisma)

Multi-tenant SaaS backend for restaurant operations.

## Stack
- NestJS
- Prisma + PostgreSQL
- Stripe Checkout + Stripe Connect
- Nash delivery integration

## Run
```bash
npm install
npm run build
npm run start:dev
```

API base prefix is `/api`.
Webhook endpoints are unprefixed:
- `/webhooks/stripe`
- `/webhooks/stripe-connect`
- `/webhooks/delivery`

## Multi-tenant behavior
- Tenant resolved per request by:
  1. JWT `tenantId` claim (for authenticated flows)
  2. Explicit `x-tenant-id` header
  3. Explicit `tenantId` request input (query/body/route param where applicable)
- Tenant-owned routes reject unresolved tenant context.
- Tenant-scoped JWT enforcement prevents cross-tenant token usage.

## Key docs
- `MIGRATION_NOTES.md`
- `API_CONTRACT_SAAS.md`
- `FRONTEND_IMPACT.md`

## Core endpoint groups
- Auth: `/api/auth/*`, `/api/customers/*`
- Public bootstrap: `/api/public/tenant/*`
- Kitchen: `/api/kitchen/*`, `/api/arrivals/*`
- Menu/Inventory/Reservations/Promotions/Reviews/Group orders
- Payments: `/api/cart/create`, `/api/payments/*`
- Delivery: `/api/delivery/*`
- Platform onboarding: `/api/platform/*`
- Tracking: `/api/orders/track/:orderId`

## Stripe Connect checkout
Checkout session creation enforces connected account readiness and sets:
- `payment_intent_data.transfer_data.destination`
- `payment_intent_data.application_fee_amount`

Persisted fee fields on `payment_links`:
- `subtotal_cents`
- `tax_cents`
- `delivery_fee_cents`
- `application_fee_cents`
- `connected_account_id`

## Quality checks
```bash
npm run build
npm run lint
npm test
```
