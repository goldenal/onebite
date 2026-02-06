-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "fulfillment" TEXT NOT NULL,
    "source_label" TEXT,
    "status" TEXT NOT NULL,
    "arrival_status" TEXT NOT NULL,
    "pickup_code" TEXT,
    "paid_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "started_at" TIMESTAMPTZ(6),
    "ready_at" TIMESTAMPTZ(6),
    "served_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "prep_estimate_minutes" INTEGER,
    "priority_flag" BOOLEAN DEFAULT false,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "order_id" TEXT,
    "name" TEXT,
    "qty" INTEGER,
    "modifiers" JSONB,
    "allergies" JSONB,
    "station" TEXT,
    "notes" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit" (
    "id" SERIAL NOT NULL,
    "order_id" TEXT,
    "ts" TIMESTAMPTZ(6) NOT NULL,
    "actor" TEXT,
    "action" TEXT,
    "details" JSONB,

    CONSTRAINT "audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_events" (
    "event_id" TEXT NOT NULL,
    "source" TEXT,

    CONSTRAINT "processed_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL,
    "category" TEXT,
    "image" TEXT,
    "dietary" JSONB DEFAULT '[]',
    "popular" BOOLEAN DEFAULT false,
    "variations" JSONB DEFAULT '[]',
    "option_groups" JSONB DEFAULT '[]',
    "includes" JSONB DEFAULT '[]',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "item_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "current_stock" INTEGER,
    "min_stock" INTEGER,
    "max_stock" INTEGER,
    "unit" TEXT,
    "status" TEXT,
    "auto_reorder" BOOLEAN,
    "last_restocked" TIMESTAMPTZ(6),

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "staff_users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "token" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL,
    "expires_at" BIGINT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "guests" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "special_requests" TEXT,
    "status" TEXT,
    "notes" TEXT,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_reviews" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "rating" INTEGER,
    "review" TEXT,
    "occasion" TEXT,
    "date" TEXT,
    "approved" BOOLEAN,
    "visible" BOOLEAN,
    "admin_notes" TEXT,
    "created_at" BIGINT,

    CONSTRAINT "customer_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_replies" (
    "id" TEXT NOT NULL,
    "review_id" TEXT,
    "sender_type" TEXT,
    "sender_name" TEXT,
    "message" TEXT,
    "is_read" BOOLEAN,
    "created_at" BIGINT,

    CONSTRAINT "review_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_access_tokens" (
    "email" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "last_requested_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_access_tokens_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "type" TEXT,
    "value" DECIMAL,
    "applicable_items" JSONB DEFAULT '[]',
    "applicable_categories" JSONB DEFAULT '[]',
    "start_date" TEXT,
    "end_date" TEXT,
    "active" BOOLEAN,
    "code" TEXT,
    "minimum_purchase" DECIMAL,
    "max_uses" INTEGER,
    "current_uses" INTEGER,
    "days_of_week" JSONB DEFAULT '[]',
    "time_start" TEXT,
    "time_end" TEXT,
    "created_at" BIGINT,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_orders" (
    "id" TEXT NOT NULL,
    "initiator_name" TEXT,
    "status" TEXT,
    "created_at" BIGINT,
    "expires_at" BIGINT,

    CONSTRAINT "group_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_order_items" (
    "id" TEXT NOT NULL,
    "group_order_id" TEXT,
    "participant_name" TEXT,
    "menu_item_id" TEXT,
    "menu_item_name" TEXT,
    "menu_item_price" DECIMAL,
    "menu_item_image" TEXT,
    "quantity" INTEGER,
    "selected_variation" JSONB,
    "selected_options" JSONB,
    "special_instructions" TEXT,
    "created_at" BIGINT,

    CONSTRAINT "group_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legacy_orders" (
    "id" TEXT NOT NULL,
    "items" JSONB,
    "total" DECIMAL,
    "status" TEXT,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "estimated_time" INTEGER,
    "timestamp" BIGINT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legacy_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_links" (
    "order_id" TEXT NOT NULL,
    "user_id" TEXT,
    "amount" DECIMAL,
    "state" TEXT,
    "payment_link" TEXT,
    "fulfillment" TEXT,
    "channel" TEXT,
    "items" JSONB,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_links_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "delivery_requests" (
    "order_id" TEXT NOT NULL,
    "provider" TEXT,
    "delivery_id" TEXT,
    "status" TEXT,
    "eta" TEXT,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_requests_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "tablet_sessions" (
    "tablet_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "question_count" INTEGER NOT NULL DEFAULT 0,
    "last_activity_timestamp" TIMESTAMPTZ(6) NOT NULL,
    "order_status" TEXT NOT NULL DEFAULT 'NONE',
    "warning_sent" BOOLEAN NOT NULL DEFAULT false,
    "agent_conversation_id" TEXT,
    "conversation_history" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tablet_sessions_pkey" PRIMARY KEY ("tablet_id")
);

-- CreateIndex
CREATE INDEX "idx_orders_channel" ON "orders"("channel");

-- CreateIndex
CREATE INDEX "idx_orders_fulfillment" ON "orders"("fulfillment");

-- CreateIndex
CREATE INDEX "idx_orders_status" ON "orders"("status");

-- CreateIndex
CREATE INDEX "idx_order_items_order_id" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "idx_audit_order_id" ON "audit"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_username_key" ON "staff_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admin_username_key" ON "admin"("username");

-- CreateIndex
CREATE INDEX "idx_tablet_sessions_last_activity" ON "tablet_sessions"("last_activity_timestamp");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit" ADD CONSTRAINT "audit_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "customer_reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "group_order_items" ADD CONSTRAINT "group_order_items_group_order_id_fkey" FOREIGN KEY ("group_order_id") REFERENCES "group_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

