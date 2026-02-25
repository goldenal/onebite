# Frontend Impact (Minimal Required Changes)

## Global (all apps)
1. Send tenant context on requests:
   - Preferred: include `x-tenant-id` header for tenant-owned routes.
   - Authenticated routes can rely on JWT `tenantId` claim after login.
2. Keep existing endpoint paths; existing paths remain valid under `/api`.
3. Ensure JWT storage is per tenant (avoid reusing token from one tenant context on another).

## Admin App
1. Login calls remain:
   - `POST /api/auth/admin/login`
2. Use new settings/content write APIs instead of local/XML storage:
   - `PUT /api/settings/contact`
   - `PUT /api/settings/hours`
   - `PUT /api/settings/about`
   - `PUT /api/content/faqs`
   - `PUT /api/content/policies`
3. Platform admin pages (new):
   - Use `/api/platform/*` endpoints for tenant onboarding, locations, Stripe Connect status.

## Kitchen App
1. Existing endpoints unchanged, but tenant-scoped now:
   - `/api/kitchen/orders`, `/api/kitchen/orders/:id`, mutate endpoints, `/api/kitchen/manual`, `/api/arrivals/:orderId`.
2. SSE stream remains `/api/kitchen/stream` and is now tenant-isolated.
3. Include tenant context (`x-tenant-id` before login, then JWT tenant claim) on stream and REST calls.

## Customer App
1. Add customer account flows:
   - `POST /api/customers/register`
   - `POST /api/customers/login`
   - `GET /api/customers/me`
   - `GET /api/customers/orders`
   - `GET /api/customers/orders/:orderId`
2. Add order tracking page using:
   - `GET /api/orders/track/:orderId`
3. Before first app load, resolve/bootstrap tenant:
   - `GET /api/public/tenant/resolve?tenantId=...`
   - `GET /api/public/tenant/bootstrap?tenantId=...`

## Payments/Checkout UI
1. No path change for checkout:
   - `POST /api/cart/create`
   - `POST /api/payments/checkout-session`
2. Delivery checkout must request quote first (`/api/delivery/quote`) for delivery fee and app fee composition.

## Backward Compatibility Notes
1. Legacy global uniqueness remains temporarily (`staff_users.username`, `review_access_tokens.email`).
2. Do not assume cross-tenant reuse of usernames/emails for legacy staff/review-token flows until follow-up migration pass.
