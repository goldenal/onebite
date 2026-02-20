-- PHASE C: Tenant-enable existing tables with additive nullable columns first.

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "location_id" TEXT;

ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "location_id" TEXT;

ALTER TABLE "audit" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;

ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "location_id" TEXT;

ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "location_id" TEXT;

ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "location_id" TEXT;

ALTER TABLE "customer_reviews" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;

ALTER TABLE "review_replies" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;

ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;

ALTER TABLE "group_orders" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;

ALTER TABLE "group_order_items" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;

ALTER TABLE "tablet_sessions" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "tablet_sessions" ADD COLUMN IF NOT EXISTS "location_id" TEXT;

ALTER TABLE "legacy_orders" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;

ALTER TABLE "processed_events" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;

ALTER TABLE "review_access_tokens" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;

ALTER TABLE "staff_users" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "staff_users" ADD COLUMN IF NOT EXISTS "location_id" TEXT;

-- Locations are now tenant-owned for SaaS routing and backfills.
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
