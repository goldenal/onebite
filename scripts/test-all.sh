#!/usr/bin/env bash
set -euo pipefail

BASE=${BASE:-http://localhost:3001}
ADMIN_USER=${ADMIN_USER:-admin}
ADMIN_PASS=${ADMIN_PASS:-password}
STAFF_CODE=${STAFF_CODE:-}
KITCHEN_TOKEN=${KITCHEN_TOKEN:-}
DELIVERY_TOKEN=${DELIVERY_TOKEN:-}

COOKIE_JAR=$(mktemp)
trap 'rm -f "$COOKIE_JAR"' EXIT

req() {
  echo "\n==> $*" >&2
  eval "$@"
}

req "curl -sS $BASE/healthz"
req "curl -sS $BASE/readyz"

# Auth login (admin)
req "curl -sS -c $COOKIE_JAR -X POST $BASE/api/auth/admin/login -H 'Content-Type: application/json' -d '{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}'"
req "curl -sS -b $COOKIE_JAR $BASE/api/auth/admin/verify"

# Staff portal (optional)
if [[ -n "$STAFF_CODE" ]]; then
  req "curl -sS -X POST $BASE/api/staff/access -H 'Content-Type: application/json' -d '{\"code\":\"$STAFF_CODE\"}'"
  req "curl -sS $BASE/api/staff/verify"
fi

# Menu
req "curl -sS $BASE/api/menu"
MENU_ID=$(curl -sS -b "$COOKIE_JAR" -X POST $BASE/api/menu -H 'Content-Type: application/json' -d '{\"name\":\"Gumbo\",\"price\":12.5,\"category\":\"Entrees\"}' | python -c "import sys, json; print(json.load(sys.stdin).get('id',''))")
if [[ -n "$MENU_ID" ]]; then
  req "curl -sS $BASE/api/menu/$MENU_ID"
  req "curl -sS -b $COOKIE_JAR -X PUT $BASE/api/menu/$MENU_ID -H 'Content-Type: application/json' -d '{\"price\":13.0}'"
fi

# Inventory
req "curl -sS $BASE/api/inventory"
req "curl -sS -b $COOKIE_JAR -X POST $BASE/api/inventory -H 'Content-Type: application/json' -d '{\"itemId\":\"gumbo\",\"itemName\":\"Gumbo\",\"currentStock\":10,\"minStock\":5}'"
req "curl -sS $BASE/api/inventory/gumbo"
req "curl -sS -b $COOKIE_JAR -X PUT $BASE/api/inventory/gumbo -H 'Content-Type: application/json' -d '{\"currentStock\":8}'"

# Settings
req "curl -sS $BASE/api/settings"
req "curl -sS $BASE/api/settings/contact"
req "curl -sS $BASE/api/settings/hours"
req "curl -sS $BASE/api/settings/about"

# Reservations
RES_ID=$(curl -sS -X POST $BASE/api/reservations -H 'Content-Type: application/json' -d '{\"name\":\"Test\",\"email\":\"test@example.com\",\"phone\":\"123\",\"guests\":\"2\",\"date\":\"2026-02-04\",\"time\":\"7:00 PM\"}' | python -c "import sys, json; print(json.load(sys.stdin).get('id',''))")
req "curl -sS -b $COOKIE_JAR $BASE/api/reservations"
if [[ -n "$RES_ID" ]]; then
  req "curl -sS -b $COOKIE_JAR $BASE/api/reservations/$RES_ID"
fi

# Promotions
PROMO_ID=$(curl -sS -b $COOKIE_JAR -X POST $BASE/api/promotions -H 'Content-Type: application/json' -d '{\"name\":\"Happy Hour\",\"description\":\"10% off\",\"type\":\"percent\",\"value\":10}' | python -c "import sys, json; print(json.load(sys.stdin).get('id',''))")
req "curl -sS $BASE/api/promotions/active"
if [[ -n "$PROMO_ID" ]]; then
  req "curl -sS $BASE/api/promotions/$PROMO_ID"
fi

# Reviews
REVIEW_ID=$(curl -sS -X POST $BASE/api/reviews -H 'Content-Type: application/json' -d '{\"name\":\"John\",\"email\":\"john@example.com\",\"rating\":5,\"review\":\"Great!\",\"occasion\":\"Dinner\"}' | python -c "import sys, json; print(json.load(sys.stdin).get('id',''))")
req "curl -sS -b $COOKIE_JAR $BASE/api/reviews"
if [[ -n "$REVIEW_ID" ]]; then
  req "curl -sS -b $COOKIE_JAR $BASE/api/reviews/$REVIEW_ID"
fi

# Group Orders
GROUP_ID=$(curl -sS -X POST $BASE/api/group-orders -H 'Content-Type: application/json' -d '{\"initiatorName\":\"Alex\"}' | python -c "import sys, json; print(json.load(sys.stdin).get('id',''))")
if [[ -n "$GROUP_ID" ]]; then
  req "curl -sS $BASE/api/group-orders/$GROUP_ID"
fi

# Payments
ORDER_ID=$(curl -sS -X POST $BASE/api/cart/create -H 'Content-Type: application/json' -d '{\"amount\":1500,\"fulfillment\":\"pickup\",\"channel\":\"web\",\"items\":[{\"name\":\"Gumbo\",\"qty\":1}]}' | python -c "import sys, json; print(json.load(sys.stdin).get('order_id',''))")
if [[ -n "$ORDER_ID" ]]; then
  req "curl -sS -X POST $BASE/api/payments/link -H 'Content-Type: application/json' -d '{\"order_id\":\"$ORDER_ID\",\"amount\":1500}'"
  req "curl -sS $BASE/api/payments/$ORDER_ID"
fi

# Delivery
if [[ -n "$ORDER_ID" ]]; then
  req "curl -sS -X POST $BASE/api/delivery/request -H 'Content-Type: application/json' -d '{\"order_id\":\"$ORDER_ID\",\"provider\":\"manual\"}'"
  req "curl -sS $BASE/api/delivery/$ORDER_ID/status"
fi

# Legacy Orders (admin)
req "curl -sS -b $COOKIE_JAR $BASE/api/orders"

# Kitchen (JWT cookie or KITCHEN_API_TOKEN)
if [[ -n "$KITCHEN_TOKEN" ]]; then
  req "curl -sS $BASE/kitchen/orders -H 'Authorization: Bearer $KITCHEN_TOKEN'"
else
  req "curl -sS -b $COOKIE_JAR $BASE/kitchen/orders"
fi

# SSE (optional)
# curl $BASE/kitchen/stream -H "Authorization: Bearer $KITCHEN_TOKEN" || true

echo "\nDONE" >&2
