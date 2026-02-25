-- Tenantize runtime checkout/delivery tables and persist fee breakdown fields.

ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "subtotal_cents" INTEGER;
ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "tax_cents" INTEGER;
ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "delivery_fee_cents" INTEGER;
ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "application_fee_cents" INTEGER;
ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "connected_account_id" TEXT;

ALTER TABLE "delivery_addresses" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "delivery_quotes" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "delivery_requests" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;

-- Backfill tenant_id using related orders where available, fallback to legacy default tenant.
UPDATE "payment_links" p
SET "tenant_id" = o."tenant_id"
FROM "orders" o
WHERE p."order_id" = o."id" AND p."tenant_id" IS NULL;
UPDATE "payment_links" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;

UPDATE "delivery_addresses" d
SET "tenant_id" = p."tenant_id"
FROM "payment_links" p
WHERE d."order_id" = p."order_id" AND d."tenant_id" IS NULL;
UPDATE "delivery_addresses" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;

UPDATE "delivery_quotes" d
SET "tenant_id" = p."tenant_id"
FROM "payment_links" p
WHERE d."order_id" = p."order_id" AND d."tenant_id" IS NULL;
UPDATE "delivery_quotes" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;

UPDATE "delivery_requests" d
SET "tenant_id" = p."tenant_id"
FROM "payment_links" p
WHERE d."order_id" = p."order_id" AND d."tenant_id" IS NULL;
UPDATE "delivery_requests" SET "tenant_id" = 'tenant_legacy_default' WHERE "tenant_id" IS NULL;

ALTER TABLE "payment_links" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "delivery_addresses" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "delivery_quotes" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';
ALTER TABLE "delivery_requests" ALTER COLUMN "tenant_id" SET DEFAULT 'tenant_legacy_default';

ALTER TABLE "payment_links" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "delivery_addresses" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "delivery_quotes" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "delivery_requests" ALTER COLUMN "tenant_id" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_payment_links_tenant_id" ON "payment_links"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_delivery_addresses_tenant_id" ON "delivery_addresses"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_delivery_quotes_tenant_id" ON "delivery_quotes"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_delivery_requests_tenant_id" ON "delivery_requests"("tenant_id");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_links_tenant_id_fkey') THEN
        ALTER TABLE "payment_links"
            ADD CONSTRAINT "payment_links_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'delivery_addresses_tenant_id_fkey') THEN
        ALTER TABLE "delivery_addresses"
            ADD CONSTRAINT "delivery_addresses_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'delivery_quotes_tenant_id_fkey') THEN
        ALTER TABLE "delivery_quotes"
            ADD CONSTRAINT "delivery_quotes_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'delivery_requests_tenant_id_fkey') THEN
        ALTER TABLE "delivery_requests"
            ADD CONSTRAINT "delivery_requests_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;
