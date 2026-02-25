-- PHASE E: Harden tenant_id nullability on safe subset.

UPDATE "orders" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;
UPDATE "order_items" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;
UPDATE "menu_items" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;
UPDATE "inventory" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;
UPDATE "reservations" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;
UPDATE "customer_reviews" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;
UPDATE "review_replies" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;
UPDATE "promotions" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;
UPDATE "group_orders" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;
UPDATE "group_order_items" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;
UPDATE "tablet_sessions" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;
UPDATE "legacy_orders" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;
UPDATE "processed_events" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;
UPDATE "locations" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;

ALTER TABLE "orders" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "order_items" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "menu_items" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "inventory" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "reservations" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "customer_reviews" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "review_replies" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "promotions" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "group_orders" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "group_order_items" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "tablet_sessions" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "legacy_orders" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "processed_events" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "locations" ALTER COLUMN "tenant_id" SET NOT NULL;

-- Intentionally still nullable for backward compatibility risk areas:
-- audit.tenant_id, review_access_tokens.tenant_id, staff_users.tenant_id
