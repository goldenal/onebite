-- PHASE C/D/E support: add defaults, indexes, and safe FK constraints.

-- Keep legacy write paths working by auto-scoping to default tenant when tenant_id is omitted.
ALTER TABLE "orders" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "order_items" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "audit" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "menu_items" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "inventory" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "reservations" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "customer_reviews" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "review_replies" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "promotions" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "group_orders" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "group_order_items" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "tablet_sessions" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "legacy_orders" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "processed_events" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "review_access_tokens" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "staff_users" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "locations" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';

-- High-read and tenant filter indexes.
CREATE INDEX IF NOT EXISTS "idx_orders_tenant_id" ON "orders"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_orders_tenant_created_at" ON "orders"("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_orders_tenant_status" ON "orders"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "idx_orders_tenant_location_id" ON "orders"("tenant_id", "location_id");

CREATE INDEX IF NOT EXISTS "idx_order_items_tenant_id" ON "order_items"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_order_items_tenant_order_id" ON "order_items"("tenant_id", "order_id");
CREATE INDEX IF NOT EXISTS "idx_order_items_tenant_location_id" ON "order_items"("tenant_id", "location_id");

CREATE INDEX IF NOT EXISTS "idx_audit_tenant_id" ON "audit"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_audit_tenant_ts" ON "audit"("tenant_id", "ts");

CREATE INDEX IF NOT EXISTS "idx_processed_events_tenant_id" ON "processed_events"("tenant_id");

CREATE INDEX IF NOT EXISTS "idx_menu_items_tenant_id" ON "menu_items"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_menu_items_tenant_created_at" ON "menu_items"("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_menu_items_tenant_location_id" ON "menu_items"("tenant_id", "location_id");

CREATE INDEX IF NOT EXISTS "idx_inventory_tenant_id" ON "inventory"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_inventory_tenant_status" ON "inventory"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "idx_inventory_tenant_location_id" ON "inventory"("tenant_id", "location_id");

CREATE INDEX IF NOT EXISTS "idx_reservations_tenant_id" ON "reservations"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_reservations_tenant_created_at" ON "reservations"("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_reservations_tenant_status" ON "reservations"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "idx_reservations_tenant_location_id" ON "reservations"("tenant_id", "location_id");

CREATE INDEX IF NOT EXISTS "idx_customer_reviews_tenant_id" ON "customer_reviews"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_customer_reviews_tenant_created_at" ON "customer_reviews"("tenant_id", "created_at");

CREATE INDEX IF NOT EXISTS "idx_review_replies_review_id" ON "review_replies"("review_id");
CREATE INDEX IF NOT EXISTS "idx_review_replies_tenant_id" ON "review_replies"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_review_replies_tenant_created_at" ON "review_replies"("tenant_id", "created_at");

CREATE INDEX IF NOT EXISTS "idx_promotions_tenant_id" ON "promotions"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_promotions_tenant_created_at" ON "promotions"("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_promotions_tenant_active" ON "promotions"("tenant_id", "active");

CREATE INDEX IF NOT EXISTS "idx_group_orders_tenant_id" ON "group_orders"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_group_orders_tenant_created_at" ON "group_orders"("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_group_orders_tenant_status" ON "group_orders"("tenant_id", "status");

CREATE INDEX IF NOT EXISTS "idx_group_order_items_tenant_id" ON "group_order_items"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_group_order_items_tenant_created_at" ON "group_order_items"("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_group_order_items_tenant_group_order_id" ON "group_order_items"("tenant_id", "group_order_id");

CREATE INDEX IF NOT EXISTS "idx_legacy_orders_tenant_id" ON "legacy_orders"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_legacy_orders_tenant_created_at" ON "legacy_orders"("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_legacy_orders_tenant_status" ON "legacy_orders"("tenant_id", "status");

CREATE INDEX IF NOT EXISTS "idx_tablet_sessions_tenant_id" ON "tablet_sessions"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_tablet_sessions_tenant_created_at" ON "tablet_sessions"("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_tablet_sessions_tenant_order_status" ON "tablet_sessions"("tenant_id", "order_status");
CREATE INDEX IF NOT EXISTS "idx_tablet_sessions_tenant_location_id" ON "tablet_sessions"("tenant_id", "location_id");

CREATE INDEX IF NOT EXISTS "idx_staff_users_tenant_id" ON "staff_users"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_staff_users_tenant_location_id" ON "staff_users"("tenant_id", "location_id");

CREATE INDEX IF NOT EXISTS "idx_review_access_tokens_tenant_id" ON "review_access_tokens"("tenant_id");

CREATE INDEX IF NOT EXISTS "idx_locations_tenant_id" ON "locations"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_locations_tenant_created_at" ON "locations"("tenant_id", "created_at");

-- Add FK constraints for tenant_id and location_id columns.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_tenant_id_fkey') THEN
        ALTER TABLE "orders"
            ADD CONSTRAINT "orders_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_tenant_id_fkey') THEN
        ALTER TABLE "order_items"
            ADD CONSTRAINT "order_items_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_tenant_id_fkey') THEN
        ALTER TABLE "audit"
            ADD CONSTRAINT "audit_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_tenant_id_fkey') THEN
        ALTER TABLE "menu_items"
            ADD CONSTRAINT "menu_items_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_tenant_id_fkey') THEN
        ALTER TABLE "inventory"
            ADD CONSTRAINT "inventory_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservations_tenant_id_fkey') THEN
        ALTER TABLE "reservations"
            ADD CONSTRAINT "reservations_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_reviews_tenant_id_fkey') THEN
        ALTER TABLE "customer_reviews"
            ADD CONSTRAINT "customer_reviews_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'review_replies_tenant_id_fkey') THEN
        ALTER TABLE "review_replies"
            ADD CONSTRAINT "review_replies_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promotions_tenant_id_fkey') THEN
        ALTER TABLE "promotions"
            ADD CONSTRAINT "promotions_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_orders_tenant_id_fkey') THEN
        ALTER TABLE "group_orders"
            ADD CONSTRAINT "group_orders_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_order_items_tenant_id_fkey') THEN
        ALTER TABLE "group_order_items"
            ADD CONSTRAINT "group_order_items_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tablet_sessions_tenant_id_fkey') THEN
        ALTER TABLE "tablet_sessions"
            ADD CONSTRAINT "tablet_sessions_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'legacy_orders_tenant_id_fkey') THEN
        ALTER TABLE "legacy_orders"
            ADD CONSTRAINT "legacy_orders_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'processed_events_tenant_id_fkey') THEN
        ALTER TABLE "processed_events"
            ADD CONSTRAINT "processed_events_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'review_access_tokens_tenant_id_fkey') THEN
        ALTER TABLE "review_access_tokens"
            ADD CONSTRAINT "review_access_tokens_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_users_tenant_id_fkey') THEN
        ALTER TABLE "staff_users"
            ADD CONSTRAINT "staff_users_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'locations_tenant_id_fkey') THEN
        ALTER TABLE "locations"
            ADD CONSTRAINT "locations_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_location_id_fkey') THEN
        ALTER TABLE "orders"
            ADD CONSTRAINT "orders_location_id_fkey"
            FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_location_id_fkey') THEN
        ALTER TABLE "order_items"
            ADD CONSTRAINT "order_items_location_id_fkey"
            FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservations_location_id_fkey') THEN
        ALTER TABLE "reservations"
            ADD CONSTRAINT "reservations_location_id_fkey"
            FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tablet_sessions_location_id_fkey') THEN
        ALTER TABLE "tablet_sessions"
            ADD CONSTRAINT "tablet_sessions_location_id_fkey"
            FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_location_id_fkey') THEN
        ALTER TABLE "inventory"
            ADD CONSTRAINT "inventory_location_id_fkey"
            FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_location_id_fkey') THEN
        ALTER TABLE "menu_items"
            ADD CONSTRAINT "menu_items_location_id_fkey"
            FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_users_location_id_fkey') THEN
        ALTER TABLE "staff_users"
            ADD CONSTRAINT "staff_users_location_id_fkey"
            FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;
