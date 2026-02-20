# Multi-tenant SaaS Migration Notes

## What changed

### Migration order
1. `prisma/migrations/20260220130000_001_saas_core_tables/migration.sql`
2. `prisma/migrations/20260220130100_002_add_tenant_columns_nullable/migration.sql`
3. `prisma/migrations/20260220130200_003_backfill_default_tenant/migration.sql`
4. `prisma/migrations/20260220130300_004_add_indexes_and_fk_constraints/migration.sql`
5. `prisma/migrations/20260220130400_005_not_null_tenant_columns_safe_subset/migration.sql`

### New SaaS core tables (additive)
- `tenants`
- `tenant_domains`
- `plans`
- `subscriptions`
- `tenant_stripe_accounts`
- `users`
- `tenant_memberships`
- `customer_accounts`
- `tenant_content`
- `processed_webhook_events`
- `tenant_settings` (parallel tenant-scoped settings table; legacy `settings` untouched)

### Existing tables tenant-enabled (additive columns)
- Added `tenant_id` to:
  - `orders`, `order_items`, `audit`, `menu_items`, `inventory`, `reservations`,
    `customer_reviews`, `review_replies`, `promotions`, `group_orders`, `group_order_items`,
    `tablet_sessions`, `legacy_orders`, `processed_events`, `review_access_tokens`, `staff_users`, `locations`
- Added `location_id` to:
  - `orders`, `order_items`, `reservations`, `tablet_sessions`, `inventory`, `menu_items`, `staff_users`

### Backfill and hardening behavior
- Default tenant seeded: `tenant_legacy_default` (`slug=legacy-default`)
- Default domain seeded: `legacy.localhost`
- Default plan/subscription seeded for the legacy tenant
- Existing rows backfilled with `tenant_id`
- Default location ensured for legacy tenant and used to backfill `location_id`
- Placeholder `tenant_stripe_accounts` row seeded for legacy tenant
- Added tenant/location FKs and SaaS indexes
- Added DB defaults for `tenant_id='tenant_legacy_default'` to keep legacy writes compatible
- Set `tenant_id NOT NULL` on safe subset:
  - `orders`, `order_items`, `menu_items`, `inventory`, `reservations`, `customer_reviews`,
    `review_replies`, `promotions`, `group_orders`, `group_order_items`, `tablet_sessions`,
    `legacy_orders`, `processed_events`, `locations`

## Intentionally legacy (compatibility preserved)
- `settings.key` remains global PK (legacy table untouched)
- `staff_users.username` remains global unique
- `review_access_tokens.email` remains PK
- `processed_events.event_id` remains PK
- Existing endpoint-facing tables and PK signatures are preserved (no destructive renames/drops)

## Follow-up migrations needed during service refactor
1. Replace legacy global settings reads/writes with `tenant_settings` and retire/readonly legacy `settings`.
2. Convert `staff_users` uniqueness from global `username` to tenant-scoped uniqueness (`UNIQUE(tenant_id, username)`) and keep/introduce global login identifier strategy as needed.
3. Replace `review_access_tokens.email` PK with tenant-scoped key strategy (`id` PK + `UNIQUE(tenant_id, email)` or composite PK).
4. Move webhook dedupe from legacy `processed_events(event_id)` semantics to provider-aware dedupe (`processed_webhook_events(provider, event_id)`) everywhere.
5. Add tenant scoping to remaining operational tables not touched in this pass (`payment_links`, `delivery_requests`, `delivery_quotes`, `delivery_addresses`, `admin`, `sessions`) based on service ownership.
6. Remove legacy `tenant_id` DB default fallback (`tenant_legacy_default`) once service layer passes explicit tenant context on all writes.

## Command log
- `npx prisma format`
  - Failed under system node due missing ICU dynamic library.
- `export PATH="$HOME/.nvm/versions/node/v22.9.0/bin:$PATH" && npx prisma format`
  - Success.
- `export PATH="$HOME/.nvm/versions/node/v22.9.0/bin:$PATH" && npx prisma validate`
  - Success (`schema.prisma` valid).
- `export PATH="$HOME/.nvm/versions/node/v22.9.0/bin:$PATH" && npx prisma migrate dev --name saas_multitenant_phase_rollout`
  - Failed: `P1001` could not reach configured PostgreSQL host.

## Verification queries and outputs
Execution was blocked because DB connectivity failed (`P1001`), so live row-count outputs are not available in this run.

Use these queries once DB connectivity is available:

```sql
-- 1) Row counts per tenant for major tables
SELECT 'orders' AS table_name, tenant_id, COUNT(*) FROM orders GROUP BY tenant_id
UNION ALL SELECT 'order_items', tenant_id, COUNT(*) FROM order_items GROUP BY tenant_id
UNION ALL SELECT 'menu_items', tenant_id, COUNT(*) FROM menu_items GROUP BY tenant_id
UNION ALL SELECT 'inventory', tenant_id, COUNT(*) FROM inventory GROUP BY tenant_id
UNION ALL SELECT 'reservations', tenant_id, COUNT(*) FROM reservations GROUP BY tenant_id
UNION ALL SELECT 'customer_reviews', tenant_id, COUNT(*) FROM customer_reviews GROUP BY tenant_id
UNION ALL SELECT 'promotions', tenant_id, COUNT(*) FROM promotions GROUP BY tenant_id
UNION ALL SELECT 'group_orders', tenant_id, COUNT(*) FROM group_orders GROUP BY tenant_id
UNION ALL SELECT 'tablet_sessions', tenant_id, COUNT(*) FROM tablet_sessions GROUP BY tenant_id
UNION ALL SELECT 'legacy_orders', tenant_id, COUNT(*) FROM legacy_orders GROUP BY tenant_id
UNION ALL SELECT 'processed_events', tenant_id, COUNT(*) FROM processed_events GROUP BY tenant_id;
```

```sql
-- 2) Null tenant_id checks (hardened tables should be zero)
SELECT
  (SELECT COUNT(*) FROM orders WHERE tenant_id IS NULL) AS orders_null_tenant,
  (SELECT COUNT(*) FROM order_items WHERE tenant_id IS NULL) AS order_items_null_tenant,
  (SELECT COUNT(*) FROM menu_items WHERE tenant_id IS NULL) AS menu_items_null_tenant,
  (SELECT COUNT(*) FROM inventory WHERE tenant_id IS NULL) AS inventory_null_tenant,
  (SELECT COUNT(*) FROM reservations WHERE tenant_id IS NULL) AS reservations_null_tenant,
  (SELECT COUNT(*) FROM customer_reviews WHERE tenant_id IS NULL) AS customer_reviews_null_tenant,
  (SELECT COUNT(*) FROM review_replies WHERE tenant_id IS NULL) AS review_replies_null_tenant,
  (SELECT COUNT(*) FROM promotions WHERE tenant_id IS NULL) AS promotions_null_tenant,
  (SELECT COUNT(*) FROM group_orders WHERE tenant_id IS NULL) AS group_orders_null_tenant,
  (SELECT COUNT(*) FROM group_order_items WHERE tenant_id IS NULL) AS group_order_items_null_tenant,
  (SELECT COUNT(*) FROM tablet_sessions WHERE tenant_id IS NULL) AS tablet_sessions_null_tenant,
  (SELECT COUNT(*) FROM legacy_orders WHERE tenant_id IS NULL) AS legacy_orders_null_tenant,
  (SELECT COUNT(*) FROM processed_events WHERE tenant_id IS NULL) AS processed_events_null_tenant;
```

```sql
-- 3) Verify default tenant + domain + location exist
SELECT id, slug, name, status FROM tenants WHERE id = 'tenant_legacy_default';
SELECT id, tenant_id, domain, is_primary FROM tenant_domains WHERE tenant_id = 'tenant_legacy_default';
SELECT id, tenant_id, name FROM locations WHERE tenant_id = 'tenant_legacy_default' ORDER BY created_at NULLS LAST, id LIMIT 5;
```

```sql
-- 4) Verify webhook unique constraint exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'processed_webhook_events'
  AND indexname = 'processed_webhook_events_provider_event_id_key';
```
