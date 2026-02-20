-- PHASE D: Backfill existing single-restaurant data into default tenant scope.

DO $$
DECLARE
    v_default_tenant_id   TEXT := 'tenant_legacy_default';
    v_default_tenant_slug TEXT := 'legacy-default';
    v_default_location_id TEXT := 'loc_legacy_default';
    v_location_id         TEXT;
BEGIN
    INSERT INTO "tenants" ("id", "slug", "name", "status", "created_at", "updated_at")
    VALUES (v_default_tenant_id, v_default_tenant_slug, 'Legacy Restaurant', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "tenant_domains" ("id", "tenant_id", "domain", "is_primary", "verified_at")
    VALUES ('tenant_domain_legacy_default', v_default_tenant_id, 'legacy.localhost', true, CURRENT_TIMESTAMP)
    ON CONFLICT ("domain") DO NOTHING;

    INSERT INTO "plans" ("id", "code", "name", "monthly_price_cents", "created_at", "updated_at")
    VALUES ('plan_legacy', 'legacy', 'Legacy Plan', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "subscriptions" (
        "id",
        "tenant_id",
        "plan_id",
        "status",
        "current_period_start",
        "current_period_end",
        "created_at",
        "updated_at"
    )
    VALUES (
        'sub_legacy_default',
        v_default_tenant_id,
        'plan_legacy',
        'active',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '1 month',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("id") DO NOTHING;

    -- Backfill tenant_id across existing tables.
    UPDATE "orders" SET "tenant_id" = v_default_tenant_id WHERE "tenant_id" IS NULL;

    UPDATE "order_items" oi
    SET "tenant_id" = o."tenant_id"
    FROM "orders" o
    WHERE oi."order_id" = o."id" AND oi."tenant_id" IS NULL;
    UPDATE "order_items" SET "tenant_id" = v_default_tenant_id WHERE "tenant_id" IS NULL;

    UPDATE "audit" a
    SET "tenant_id" = o."tenant_id"
    FROM "orders" o
    WHERE a."order_id" = o."id" AND a."tenant_id" IS NULL;
    UPDATE "audit" SET "tenant_id" = v_default_tenant_id WHERE "tenant_id" IS NULL;

    UPDATE "menu_items" SET "tenant_id" = v_default_tenant_id WHERE "tenant_id" IS NULL;
    UPDATE "inventory" SET "tenant_id" = v_default_tenant_id WHERE "tenant_id" IS NULL;
    UPDATE "reservations" SET "tenant_id" = v_default_tenant_id WHERE "tenant_id" IS NULL;
    UPDATE "customer_reviews" SET "tenant_id" = v_default_tenant_id WHERE "tenant_id" IS NULL;

    UPDATE "review_replies" rr
    SET "tenant_id" = cr."tenant_id"
    FROM "customer_reviews" cr
    WHERE rr."review_id" = cr."id" AND rr."tenant_id" IS NULL;
    UPDATE "review_replies" SET "tenant_id" = v_default_tenant_id WHERE "tenant_id" IS NULL;

    UPDATE "promotions" SET "tenant_id" = v_default_tenant_id WHERE "tenant_id" IS NULL;
    UPDATE "group_orders" SET "tenant_id" = v_default_tenant_id WHERE "tenant_id" IS NULL;

    UPDATE "group_order_items" goi
    SET "tenant_id" = go."tenant_id"
    FROM "group_orders" go
    WHERE goi."group_order_id" = go."id" AND goi."tenant_id" IS NULL;
    UPDATE "group_order_items" SET "tenant_id" = v_default_tenant_id WHERE "tenant_id" IS NULL;

    UPDATE "tablet_sessions" SET "tenant_id" = v_default_tenant_id WHERE "tenant_id" IS NULL;
    UPDATE "legacy_orders" SET "tenant_id" = v_default_tenant_id WHERE "tenant_id" IS NULL;
    UPDATE "processed_events" SET "tenant_id" = v_default_tenant_id WHERE "tenant_id" IS NULL;
    UPDATE "review_access_tokens" SET "tenant_id" = v_default_tenant_id WHERE "tenant_id" IS NULL;
    UPDATE "staff_users" SET "tenant_id" = v_default_tenant_id WHERE "tenant_id" IS NULL;
    UPDATE "locations" SET "tenant_id" = v_default_tenant_id WHERE "tenant_id" IS NULL;

    -- Ensure there is at least one location for the default tenant.
    SELECT l."id" INTO v_location_id
    FROM "locations" l
    WHERE l."tenant_id" = v_default_tenant_id
    ORDER BY l."created_at" NULLS LAST, l."id"
    LIMIT 1;

    IF v_location_id IS NULL THEN
        INSERT INTO "locations" (
            "id",
            "tenant_id",
            "name",
            "phone",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "postal_code",
            "country",
            "created_at",
            "updated_at"
        )
        VALUES (
            v_default_location_id,
            v_default_tenant_id,
            'Legacy Main Location',
            '0000000000',
            'Legacy Address',
            NULL,
            'Legacy City',
            'Legacy State',
            '00000',
            'US',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT ("id") DO NOTHING;

        SELECT l."id" INTO v_location_id
        FROM "locations" l
        WHERE l."tenant_id" = v_default_tenant_id
        ORDER BY l."created_at" NULLS LAST, l."id"
        LIMIT 1;
    END IF;

    -- Backfill location_id for existing operational tables.
    UPDATE "orders" SET "location_id" = v_location_id WHERE "location_id" IS NULL;

    UPDATE "order_items" oi
    SET "location_id" = o."location_id"
    FROM "orders" o
    WHERE oi."order_id" = o."id" AND oi."location_id" IS NULL;
    UPDATE "order_items" SET "location_id" = v_location_id WHERE "location_id" IS NULL;

    UPDATE "reservations" SET "location_id" = v_location_id WHERE "location_id" IS NULL;
    UPDATE "tablet_sessions" SET "location_id" = v_location_id WHERE "location_id" IS NULL;
    UPDATE "inventory" SET "location_id" = v_location_id WHERE "location_id" IS NULL;
    UPDATE "menu_items" SET "location_id" = v_location_id WHERE "location_id" IS NULL;
    UPDATE "staff_users" SET "location_id" = v_location_id WHERE "location_id" IS NULL;

    -- Placeholder Stripe state for legacy tenant.
    INSERT INTO "tenant_stripe_accounts" (
        "tenant_id",
        "connect_account_id",
        "charges_enabled",
        "payouts_enabled",
        "details_submitted",
        "onboarding_complete",
        "created_at",
        "updated_at"
    )
    VALUES (
        v_default_tenant_id,
        NULL,
        false,
        false,
        false,
        false,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("tenant_id") DO NOTHING;
END $$;
