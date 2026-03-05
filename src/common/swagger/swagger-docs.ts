type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

type OperationTemplate = {
  summary: string;
  description: string;
  statusCode?: string;
  contentType?: string;
  example: unknown;
};

type SwaggerDocument = {
  paths?: Record<string, Record<string, any>>;
};

const METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete'];

function sentenceCase(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toWords(path: string) {
  return path
    .replace(/^\/api\//, '')
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/[{}]/g, '').replace(/-/g, ' '))
    .join(' ')
    .trim();
}

function defaultSummary(method: HttpMethod, path: string) {
  return `${method.toUpperCase()} ${sentenceCase(toWords(path) || 'Endpoint')}`;
}

function defaultExample(method: HttpMethod, path: string) {
  return {
    success: true,
    method: method.toUpperCase(),
    path,
    message: 'Request completed successfully',
  };
}

function isTenantAwarePath(path: string) {
  if (!path.startsWith('/api/')) return false;
  if (path.startsWith('/api/public/tenant/resolve')) return false;
  if (path.startsWith('/api/platform/')) return false;
  if (path.startsWith('/api/auth/')) return false;
  return true;
}

function ensureTenantHeader(path: string, operation: any) {
  if (!isTenantAwarePath(path)) return;
  const parameters = Array.isArray(operation.parameters) ? operation.parameters : [];
  const hasTenantHeader = parameters.some((param: any) => param?.in === 'header' && param?.name === 'x-tenant-id');
  if (!hasTenantHeader) {
    parameters.push({
      name: 'x-tenant-id',
      in: 'header',
      required: false,
      schema: { type: 'string', example: 'tenant_alpha' },
      description: 'Tenant ID scope for the request. Optional when bearer token already contains tenantId.',
    });
  }
  operation.parameters = parameters;
}

function ensureCommonErrors(path: string, operation: any) {
  const responses = operation.responses || {};

  if (operation.security && !responses['401']) {
    responses['401'] = {
      description: 'Unauthorized',
      content: {
        'application/json': {
          example: { statusCode: 401, code: 'unauthorized', message: 'Unauthorized' },
        },
      },
    };
  }

  if (isTenantAwarePath(path) && !responses['404']) {
    responses['404'] = {
      description: 'Tenant or resource not found',
      content: {
        'application/json': {
          example: { statusCode: 404, code: 'tenant_not_resolved', message: 'Tenant could not be resolved for request' },
        },
      },
    };
  }

  if (!responses['400']) {
    responses['400'] = {
      description: 'Bad request',
      content: {
        'application/json': {
          example: { statusCode: 400, code: 'bad_request', message: 'Request validation failed' },
        },
      },
    };
  }

  operation.responses = responses;
}

function upsertSuccessResponse(operation: any, method: HttpMethod, template: OperationTemplate) {
  const responses = operation.responses || {};
  const statusCode = template.statusCode || (method === 'post' ? '201' : '200');
  const contentType = template.contentType || 'application/json';
  const is2xxPrimary = /^2\d\d$/.test(statusCode);

  const current = responses[statusCode] || { description: 'Successful response' };
  current.description = template.description || current.description;

  current.content = current.content || {};
  current.content[contentType] = current.content[contentType] || {};
  if (!current.content[contentType].example) {
    current.content[contentType].example = template.example;
  }

  responses[statusCode] = current;

  // When endpoint intentionally documents a non-2xx primary response (e.g., 503),
  // remove misleading auto-generated 2xx placeholders that have no content/examples.
  if (!is2xxPrimary) {
    for (const code of ['200', '201', '202', '204']) {
      if (code === statusCode) continue;
      const candidate = responses[code];
      if (!candidate) continue;
      const hasContent = candidate.content && Object.keys(candidate.content).length > 0;
      if (!hasContent) delete responses[code];
    }
  }

  operation.responses = responses;
}

function templateForPaymentPaths(method: HttpMethod, path: string): OperationTemplate | null {
  if (path === '/api/cart/create' && method === 'post') {
    return {
      summary: 'Create cart order shell',
      description: 'Creates a tenant-scoped order shell from priced menu items and stores payment link state as awaiting payment.',
      example: { order_id: 'ord_9f9cf9d7', amount: 28.5, state: 'AWAITING_PAYMENT' },
    };
  }

  if (path === '/api/payments/link' && method === 'post') {
    return {
      summary: 'Generate payment link',
      description: 'Builds or refreshes a payment link for an existing tenant order.',
      example: { payment_link: 'https://checkout.stripe.com/c/pay/cs_test_123', amount: 28.5, state: 'AWAITING_PAYMENT' },
    };
  }

  if (path === '/api/payments/{orderId}' && method === 'get') {
    return {
      summary: 'Get payment state',
      description: 'Returns payment link record for the tenant order.',
      example: { orderId: 'ord_9f9cf9d7', tenantId: 'tenant_alpha', state: 'PAID', amount: 28.5 },
      statusCode: '200',
    };
  }

  if (path === '/api/phone/payment-link' && method === 'post') {
    return {
      summary: 'Create phone payment link',
      description: 'Creates a tenant-scoped phone order and returns a payment link.',
      example: { order_id: 'ord_0b2c6f44', payment_link: 'https://checkout.stripe.com/c/pay/cs_test_456', amount: 42.25, state: 'AWAITING_PAYMENT' },
    };
  }

  if (path === '/api/payments/checkout-session' && method === 'post') {
    return {
      summary: 'Create Stripe checkout session',
      description:
        'Creates a checkout session using Stripe Connect destination charges and application fee. Response includes persisted fee breakdown.',
      example: {
        order_id: 'ord_9f9cf9d7',
        session_id: 'cs_test_a1b2c3',
        payment_link: 'https://checkout.stripe.com/c/pay/cs_test_a1b2c3',
        amount: 31,
        subtotal_cents: 2500,
        tax_cents: 0,
        delivery_fee_cents: 500,
        application_fee_cents: 625,
        connected_account_id: 'acct_123456789',
        state: 'AWAITING_PAYMENT',
      },
    };
  }

  if (path === '/api/payments/summary' && method === 'get') {
    return {
      summary: 'Get payment summary',
      description: 'Returns tenant payment KPIs (counts, gross/fees/net) for the requested date range.',
      example: {
        tenantId: 'tenant_alpha',
        period: { from: '2026-02-01T00:00:00.000Z', to: '2026-02-29T23:59:59.999Z' },
        counts: { total: 32, paid: 28, awaitingPayment: 3, failed: 1 },
        amounts: {
          grossCents: 78450,
          subtotalCents: 70000,
          taxCents: 2450,
          deliveryFeeCents: 6000,
          applicationFeeCents: 5120,
          estimatedNetToRestaurantCents: 73330,
        },
      },
      statusCode: '200',
    };
  }

  if (path === '/api/payments/transactions' && method === 'get') {
    return {
      summary: 'List payment transactions',
      description: 'Returns paginated tenant payment transactions for operational and finance views.',
      example: {
        tenantId: 'tenant_alpha',
        pagination: { page: 1, limit: 20, total: 54, totalPages: 3 },
        items: [
          {
            orderId: 'ord_1',
            state: 'PAID',
            amountCents: 3250,
            subtotalCents: 2800,
            taxCents: 0,
            deliveryFeeCents: 450,
            applicationFeeCents: 590,
            estimatedNetToRestaurantCents: 2660,
          },
        ],
      },
      statusCode: '200',
    };
  }

  if (path === '/api/payments/connect-account' && method === 'post') {
    return {
      summary: 'Start Stripe Connect onboarding',
      description: 'Creates or resumes Stripe Connect onboarding for the current tenant.',
      example: {
        tenantId: 'tenant_alpha',
        connectAccountId: 'acct_123456789',
        onboardingUrl: 'https://connect.stripe.com/setup/s/acct_123456789',
      },
    };
  }

  if (path === '/api/payments/connect-status' && method === 'get') {
    return {
      summary: 'Get Stripe Connect status',
      description: 'Returns the current tenant Stripe Connect readiness state.',
      example: {
        tenantId: 'tenant_alpha',
        connectAccountId: 'acct_123456789',
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      },
      statusCode: '200',
    };
  }

  return null;
}

function templateForPath(method: HttpMethod, path: string): OperationTemplate {
  const paymentTemplate = templateForPaymentPaths(method, path);
  if (paymentTemplate) return paymentTemplate;

  if (path === '/healthz' && method === 'get') {
    return {
      summary: 'Liveness probe',
      description: 'Basic process health check endpoint.',
      example: { ok: true },
      statusCode: '200',
    };
  }

  if (path === '/readyz' && method === 'get') {
    return {
      summary: 'Readiness probe',
      description: 'Checks database connectivity and returns service readiness state.',
      example: { ready: true },
      statusCode: '200',
    };
  }

  if (path === '/webhooks/stripe' && method === 'post') {
    return {
      summary: 'Stripe payment webhook',
      description: 'Processes Stripe payment events, enforces idempotency, and updates order/payment state.',
      example: { received: true },
      statusCode: '200',
    };
  }

  if (path === '/webhooks/stripe-connect' && method === 'post') {
    return {
      summary: 'Stripe Connect webhook',
      description: 'Processes connected account lifecycle events and updates tenant Stripe account readiness.',
      example: { received: true },
      statusCode: '200',
    };
  }

  if (path === '/webhooks/delivery' && method === 'post') {
    return {
      summary: 'Delivery webhook',
      description: 'Processes delivery provider status callbacks and updates the matching tenant order.',
      example: { ok: true },
      statusCode: '200',
    };
  }

  if (path === '/api/public/tenant/resolve' && method === 'get') {
    return {
      summary: 'Resolve tenant',
      description: 'Resolves tenant context by explicit tenant ID.',
      example: {
        tenantId: 'tenant_alpha',
        slug: 'alpha',
        name: 'Alpha Restaurant',
        status: 'active',
        domain: 'alpha.example.com',
      },
      statusCode: '200',
    };
  }

  if (path === '/api/public/tenant/bootstrap' && method === 'get') {
    return {
      summary: 'Tenant bootstrap payload',
      description: 'Returns tenant public bootstrap data (branding, location, settings, content, and feature flags).',
      example: {
        tenant: { id: 'tenant_alpha', slug: 'alpha', name: 'Alpha Restaurant' },
        location: { id: 'loc_1', name: 'Main Location' },
        settings: { contact: {}, hours: {}, about: {} },
        content: { faqs: [], policies: {} },
      },
      statusCode: '200',
    };
  }

  if (path.startsWith('/api/business/')) {
    if (path === '/api/business/me' && method === 'get') {
      return {
        summary: 'Get my business profile',
        description: 'Returns tenant profile, domains, Stripe account status, and locations for the logged-in business owner/admin.',
        example: {
          id: 'tenant_bitter',
          slug: 'bitter',
          name: 'Bitter Restaurant',
          status: 'active',
          locations: [{ id: 'loc_1', name: 'Main Branch', city: 'San Francisco', state: 'CA' }],
        },
        statusCode: '200',
      };
    }

    if (path === '/api/business/me' && method === 'patch') {
      return {
        summary: 'Update my business profile',
        description: 'Updates tenant profile fields for the current business.',
        example: { id: 'tenant_bitter', slug: 'bitter', name: 'Bitter Restaurant', status: 'active' },
        statusCode: '200',
      };
    }

    if (path === '/api/business/locations' && method === 'get') {
      return {
        summary: 'List my business locations',
        description: 'Returns tenant-owned locations for the current business.',
        example: [{ id: 'loc_1', name: 'Main Branch', city: 'San Francisco', state: 'CA' }],
        statusCode: '200',
      };
    }

    if (path === '/api/business/locations' && method === 'post') {
      return {
        summary: 'Create business location',
        description: 'Creates a new location under the current tenant.',
        example: { id: 'loc_2', name: 'Downtown Branch', city: 'Oakland', state: 'CA' },
      };
    }
  }

  if (path.startsWith('/api/auth/')) {
    if (path.endsWith('/login') && method === 'post') {
      return {
        summary: 'Business user login',
        description:
          'Authenticates with email/password, auto-discovers tenant membership server-side, and returns a tenant-scoped JWT. When credentials belong to multiple tenants, provide optional `tenantId` in body.',
        example: {
          success: true,
          username: 'owner@alpha.com',
          role: 'admin',
          tenantId: 'tenant_alpha',
          token: 'eyJhbGciOi...',
          message: 'Login successful',
        },
      };
    }

    if (path.endsWith('/verify') && method === 'get') {
      return {
        summary: 'Verify auth token',
        description: 'Verifies bearer token validity and role access.',
        example: { valid: true },
        statusCode: '200',
      };
    }

    if (path.endsWith('/logout') && method === 'post') {
      return {
        summary: 'Logout',
        description: 'Stateless logout acknowledgement endpoint for compatibility with frontend flows.',
        example: { success: true, message: 'Logged out' },
      };
    }
  }

  if (path.startsWith('/api/customers/')) {
    if (path === '/api/customers/register' && method === 'post') {
      return {
        summary: 'Register customer account',
        description: 'Creates a tenant-scoped customer account and returns authenticated session payload.',
        example: { success: true, customerId: 'cust_1', email: 'guest@example.com', token: 'eyJhbGciOi...' },
      };
    }

    if (path === '/api/customers/login' && method === 'post') {
      return {
        summary: 'Customer login',
        description: 'Authenticates a customer account within the current tenant.',
        example: { success: true, customerId: 'cust_1', email: 'guest@example.com', token: 'eyJhbGciOi...' },
      };
    }

    if (path === '/api/customers/logout' && method === 'post') {
      return {
        summary: 'Customer logout',
        description: 'Stateless logout acknowledgement endpoint for customer clients.',
        example: { success: true, message: 'Logged out' },
      };
    }

    if (path === '/api/customers/me' && method === 'get') {
      return {
        summary: 'Current customer profile',
        description: 'Returns the authenticated customer account profile in tenant scope.',
        example: { id: 'cust_1', email: 'guest@example.com', firstName: 'Ada', lastName: 'Cole', phone: '+14155550199' },
        statusCode: '200',
      };
    }

    if (path === '/api/customers/orders' && method === 'get') {
      return {
        summary: 'Customer order history',
        description: 'Returns tenant-scoped orders belonging to the authenticated customer.',
        example: [{ id: 'ord_1', status: 'queued', fulfillment: 'delivery', createdAt: '2026-02-23T10:15:00.000Z' }],
        statusCode: '200',
      };
    }

    if (path === '/api/customers/orders/{orderId}' && method === 'get') {
      return {
        summary: 'Customer order detail',
        description: 'Returns one tenant-scoped order for the authenticated customer.',
        example: { id: 'ord_1', status: 'ready_waiting_arrival', items: [{ name: 'Jerk Chicken Plate', qty: 1 }] },
        statusCode: '200',
      };
    }
  }

  if (path === '/api/orders/track/{orderId}' && method === 'get') {
    return {
      summary: 'Public order tracking',
      description: 'Returns a safe tenant-scoped order tracking payload with status and timeline.',
      example: {
        orderId: 'ord_1',
        status: 'in_prep',
        arrivalStatus: 'waiting',
        fulfillment: 'pickup',
        eta: 20,
        paidAt: '2026-02-23T10:00:00.000Z',
        timeline: [{ ts: '2026-02-23T10:01:00.000Z', actor: 'system', action: 'paid' }],
      },
      statusCode: '200',
    };
  }

  if (path.startsWith('/api/platform/')) {
    if (path === '/api/platform/auth/login' && method === 'post') {
      return {
        summary: 'Platform login',
        description: 'Authenticates platform operator and returns a platform-scoped JWT.',
        example: { success: true, role: 'platform', token: 'eyJhbGciOi...' },
      };
    }

    if (path === '/api/platform/restaurants' && method === 'get') {
      return {
        summary: 'List restaurants',
        description: 'Lists all tenant restaurants managed on the platform.',
        example: [{ id: 'tenant_alpha', slug: 'alpha', name: 'Alpha Restaurant', status: 'active' }],
        statusCode: '200',
      };
    }

    if (path === '/api/platform/restaurants' && method === 'post') {
      return {
        summary: 'Create restaurant tenant',
        description:
          'Creates a new tenant restaurant with required real location details. Owner credentials are optional; when provided, response includes an admin token.',
        example: {
          id: 'tenant_beta',
          slug: 'beta',
          name: 'Beta Kitchen',
          status: 'active',
          locations: [
            {
              id: 'loc_1',
              name: 'Main Branch',
              phone: '+1-415-555-0199',
              address_line1: '123 Main Street',
              city: 'San Francisco',
              state: 'CA',
              postal_code: '94103',
              country: 'US',
            },
          ],
          owner: { email: 'owner@beta.com', role: 'owner' },
          auth: { role: 'admin', token: 'eyJhbGciOi...' },
        },
      };
    }

    if (path === '/api/platform/restaurants/{tenantId}' && method === 'get') {
      return {
        summary: 'Get restaurant tenant',
        description: 'Returns platform view of one tenant restaurant.',
        example: { id: 'tenant_alpha', slug: 'alpha', name: 'Alpha Restaurant', status: 'active' },
        statusCode: '200',
      };
    }

    if (path === '/api/platform/restaurants/{tenantId}' && method === 'patch') {
      return {
        summary: 'Update restaurant tenant',
        description: 'Updates restaurant metadata (slug, name, status).',
        example: { id: 'tenant_alpha', slug: 'alpha', name: 'Alpha Restaurant Updated', status: 'active' },
        statusCode: '200',
      };
    }

    if (path === '/api/platform/restaurants/{tenantId}/locations' && method === 'post') {
      return {
        summary: 'Create tenant location',
        description: 'Creates a location under a tenant restaurant.',
        example: { id: 'loc_1', tenantId: 'tenant_alpha', name: 'Main Location', city: 'Portland', state: 'OR' },
      };
    }

    if (path === '/api/platform/restaurants/{tenantId}/locations' && method === 'get') {
      return {
        summary: 'List tenant locations',
        description: 'Lists all configured locations for a tenant restaurant.',
        example: [{ id: 'loc_1', name: 'Main Location', city: 'Portland', state: 'OR' }],
        statusCode: '200',
      };
    }

    if (path === '/api/platform/restaurants/{tenantId}/stripe/connect-account' && method === 'post') {
      return {
        summary: 'Create or resume Stripe Connect onboarding',
        description: 'Creates or refreshes connected account onboarding and returns onboarding URL/status.',
        example: { tenantId: 'tenant_alpha', connectAccountId: 'acct_123', onboardingUrl: 'https://connect.stripe.com/setup/s/abc' },
      };
    }

    if (path === '/api/platform/restaurants/{tenantId}/stripe/connect-status' && method === 'get') {
      return {
        summary: 'Get Stripe Connect status',
        description: 'Returns tenant connected account state for charges, payouts, and onboarding completion.',
        example: {
          tenantId: 'tenant_alpha',
          connectAccountId: 'acct_123',
          onboardingComplete: true,
          chargesEnabled: true,
          payoutsEnabled: true,
        },
        statusCode: '200',
      };
    }
  }

  if (path.startsWith('/api/settings/')) {
    const settingKey = path.split('/').pop() || 'setting';
    return {
      summary: `${method === 'put' ? 'Update' : 'Get'} ${settingKey} settings`,
      description: `Reads or writes tenant-scoped ${settingKey} settings stored in the database.`,
      example: method === 'put' ? { [settingKey]: { updated: true } } : { timezone: 'America/Los_Angeles' },
      statusCode: method === 'put' ? '200' : '200',
    };
  }

  if (path.startsWith('/api/content/')) {
    const contentKey = path.split('/').pop() || 'content';
    return {
      summary: `${method === 'put' ? 'Update' : 'Get'} ${contentKey} content`,
      description: `Reads or writes tenant-scoped ${contentKey} content payload.`,
      example: { [contentKey]: contentKey === 'faqs' ? [{ q: 'Do you deliver?', a: 'Yes.' }] : { terms: 'All sales final.' } },
      statusCode: '200',
    };
  }

  if (path.startsWith('/api/kitchen/stream') && method === 'get') {
    return {
      summary: 'Kitchen stream (SSE)',
      description: 'Streams tenant-scoped kitchen order updates over server-sent events.',
      example: 'data: {"type":"orders.snapshot","orders":[{"id":"ord_1","status":"queued"}]}',
      statusCode: '200',
      contentType: 'text/event-stream',
    };
  }

  if (path.startsWith('/api/kitchen/orders/') && method === 'post') {
    return {
      summary: 'Mutate kitchen order state',
      description: 'Performs tenant-scoped order state transition (status, arrival, refire, or edit) for kitchen workflow.',
      example: { id: 'ord_1', status: 'in_prep', arrival_status: 'waiting' },
    };
  }

  if (path === '/api/kitchen/orders' && method === 'get') {
    return {
      summary: 'List kitchen orders',
      description: 'Returns tenant-scoped kitchen order queue with optional status/channel/fulfillment filters.',
      example: { orders: [{ id: 'ord_1', status: 'queued', channel: 'web', fulfillment: 'pickup' }] },
      statusCode: '200',
    };
  }

  if (path === '/api/kitchen/orders/{id}' && method === 'get') {
    return {
      summary: 'Get kitchen order',
      description: 'Returns one tenant-scoped kitchen order.',
      example: { id: 'ord_1', status: 'queued', items: [{ name: 'Plantains', qty: 2 }] },
      statusCode: '200',
    };
  }

  if (path === '/api/kitchen/orders/{id}/status' && method === 'get') {
    return {
      summary: 'Get kitchen order status',
      description: 'Returns lightweight status payload for a tenant order.',
      example: { order_id: 'ord_1', status: 'queued', arrival_status: 'waiting', fulfillment: 'pickup', channel: 'web' },
      statusCode: '200',
    };
  }

  if (path === '/api/kitchen/manual' && method === 'post') {
    return {
      summary: 'Create manual kitchen order',
      description: 'Creates a manual tenant-scoped kitchen order for walk-in or operator-assisted flow.',
      example: { id: 'ord_manual_1', status: 'queued', channel: 'manual' },
    };
  }

  if (path === '/api/kitchen/demo' && method === 'post') {
    return {
      summary: 'Seed kitchen demo orders',
      description: 'Seeds demo orders for tenant kitchen testing.',
      example: { success: true, seeded: 3 },
    };
  }

  if (path.startsWith('/api/arrivals/') && method === 'post') {
    return {
      summary: 'Mark pickup arrival',
      description: 'Marks tenant order as customer-arrived at pickup.',
      example: { arrival_status: 'arrived', order_id: 'ord_1' },
    };
  }

  if (path.startsWith('/api/menu')) {
    if (path === '/api/menu' && method === 'get') {
      return {
        summary: 'List menu items',
        description: 'Returns tenant menu items.',
        example: [{ id: 'menu_1', name: 'Jerk Chicken', price: 18.5, active: true }],
        statusCode: '200',
      };
    }
    if (path === '/api/menu' && method === 'post') {
      return {
        summary: 'Create menu item',
        description: 'Creates a tenant menu item.',
        example: { id: 'menu_1', name: 'Jerk Chicken', price: 18.5, active: true },
      };
    }
    if (path === '/api/menu/{id}' && method === 'put') {
      return {
        summary: 'Update menu item',
        description: 'Updates a tenant menu item by id.',
        example: { id: 'menu_1', name: 'Jerk Chicken Deluxe', price: 19.5, active: true },
        statusCode: '200',
      };
    }
    if (path === '/api/menu/{id}' && method === 'delete') {
      return {
        summary: 'Delete menu item',
        description: 'Deletes a tenant menu item by id.',
        example: { success: true },
        statusCode: '200',
      };
    }
    if (path === '/api/menu/{id}' && method === 'get') {
      return {
        summary: 'Get menu item',
        description: 'Returns one tenant menu item by id.',
        example: { id: 'menu_1', name: 'Jerk Chicken', price: 18.5, active: true },
        statusCode: '200',
      };
    }
  }

  if (path.startsWith('/api/inventory')) {
    if (path === '/api/inventory' && method === 'get') {
      return {
        summary: 'List inventory items',
        description: 'Returns tenant inventory records.',
        example: [{ id: 'inv_1', name: 'Chicken Wings', quantity: 24, unit: 'lb' }],
        statusCode: '200',
      };
    }
    if (path === '/api/inventory' && method === 'post') {
      return {
        summary: 'Create inventory item',
        description: 'Creates a tenant inventory record.',
        example: { id: 'inv_1', name: 'Chicken Wings', quantity: 24, unit: 'lb' },
      };
    }
    if (path === '/api/inventory/{itemId}' && method === 'get') {
      return {
        summary: 'Get inventory item',
        description: 'Returns one tenant inventory record.',
        example: { id: 'inv_1', name: 'Chicken Wings', quantity: 24, unit: 'lb' },
        statusCode: '200',
      };
    }
    if (path === '/api/inventory/{itemId}' && method === 'put') {
      return {
        summary: 'Update inventory item',
        description: 'Updates a tenant inventory record.',
        example: { id: 'inv_1', quantity: 20 },
        statusCode: '200',
      };
    }
    if (path === '/api/inventory/{itemId}' && method === 'delete') {
      return {
        summary: 'Delete inventory item',
        description: 'Deletes a tenant inventory record.',
        example: { success: true },
        statusCode: '200',
      };
    }
  }

  if (path.startsWith('/api/reservations')) {
    if (path === '/api/reservations' && method === 'get') {
      return {
        summary: 'List reservations',
        description: 'Returns tenant reservation records for admin operations.',
        example: [{ id: 'res_1', name: 'Pat Smith', partySize: 4, when: '2026-02-23T19:30:00.000Z' }],
        statusCode: '200',
      };
    }
    if (path === '/api/reservations' && method === 'post') {
      return {
        summary: 'Create reservation',
        description: 'Creates a tenant reservation request.',
        example: { id: 'res_1', name: 'Pat Smith', partySize: 4, status: 'booked' },
      };
    }
    if (path === '/api/reservations/{id}' && method === 'get') {
      return {
        summary: 'Get reservation',
        description: 'Returns one tenant reservation by id.',
        example: { id: 'res_1', name: 'Pat Smith', partySize: 4, status: 'booked' },
        statusCode: '200',
      };
    }
    if (path === '/api/reservations/{id}' && method === 'put') {
      return {
        summary: 'Update reservation',
        description: 'Updates a tenant reservation.',
        example: { id: 'res_1', status: 'seated' },
        statusCode: '200',
      };
    }
    if (path === '/api/reservations/{id}' && method === 'delete') {
      return {
        summary: 'Delete reservation',
        description: 'Deletes a tenant reservation record.',
        example: { success: true },
        statusCode: '200',
      };
    }
  }

  if (path.startsWith('/api/promotions')) {
    if (path === '/api/promotions' && method === 'get') {
      return {
        summary: 'List promotions',
        description: 'Returns tenant promotions for admin view.',
        example: [{ id: 'promo_1', code: 'LUNCH10', active: true }],
        statusCode: '200',
      };
    }
    if (path === '/api/promotions/active' && method === 'get') {
      return {
        summary: 'List active promotions',
        description: 'Returns publicly-eligible active promotions for tenant storefront.',
        example: [{ id: 'promo_1', code: 'LUNCH10', active: true }],
        statusCode: '200',
      };
    }
    if (path === '/api/promotions/{id}' && method === 'get') {
      return {
        summary: 'Get promotion',
        description: 'Returns one tenant promotion by id.',
        example: { id: 'promo_1', code: 'LUNCH10', active: true },
        statusCode: '200',
      };
    }
    if (path === '/api/promotions' && method === 'post') {
      return {
        summary: 'Create promotion',
        description: 'Creates a tenant promotion.',
        example: { id: 'promo_1', code: 'LUNCH10', active: true },
      };
    }
    if (path === '/api/promotions/{id}' && method === 'put') {
      return {
        summary: 'Update promotion',
        description: 'Updates a tenant promotion.',
        example: { id: 'promo_1', code: 'LUNCH12', active: true },
        statusCode: '200',
      };
    }
    if (path === '/api/promotions/{id}' && method === 'delete') {
      return {
        summary: 'Delete promotion',
        description: 'Deletes a tenant promotion.',
        example: { success: true },
        statusCode: '200',
      };
    }
  }

  if (path.startsWith('/api/reviews')) {
    if (path === '/api/reviews' && method === 'get') {
      return {
        summary: 'List reviews (admin)',
        description: 'Returns tenant reviews with admin visibility.',
        example: [{ id: 'rev_1', rating: 5, comment: 'Amazing food', approved: true }],
        statusCode: '200',
      };
    }
    if (path === '/api/reviews/approved' && method === 'get') {
      return {
        summary: 'List approved reviews',
        description: 'Returns publicly approved tenant reviews.',
        example: [{ id: 'rev_1', rating: 5, comment: 'Amazing food', approved: true }],
        statusCode: '200',
      };
    }
    if (path === '/api/reviews/public/with-replies' && method === 'get') {
      return {
        summary: 'List public reviews with replies',
        description: 'Returns approved reviews and threaded replies for storefront rendering.',
        example: [{ id: 'rev_1', rating: 5, replies: [{ id: 'rpl_1', body: 'Thank you!' }] }],
        statusCode: '200',
      };
    }
    if (method === 'post' && (path === '/api/reviews' || path === '/api/reviews/access/request')) {
      return {
        summary: path.endsWith('access/request') ? 'Request review access token' : 'Create review',
        description: path.endsWith('access/request')
          ? 'Creates or returns a review access token for a customer email.'
          : 'Creates a tenant review record.',
        example: path.endsWith('access/request')
          ? { success: true, email: 'guest@example.com' }
          : { id: 'rev_1', rating: 5, comment: 'Amazing food' },
      };
    }
    if (path.includes('/replies') && method === 'post') {
      return {
        summary: 'Create review reply',
        description: 'Creates tenant-scoped reply on a review conversation thread.',
        example: { id: 'rpl_1', reviewId: 'rev_1', body: 'Thanks for your feedback!' },
      };
    }
    if (path.includes('/replies') && method === 'get') {
      return {
        summary: 'List review replies',
        description: 'Lists replies for a tenant review conversation.',
        example: [{ id: 'rpl_1', body: 'Thanks!', actor: 'admin' }],
        statusCode: '200',
      };
    }
    if (path.includes('/replies/mark-read') && method === 'put') {
      return {
        summary: 'Mark review conversation read',
        description: 'Marks a review conversation as read/unread for the acting tenant user.',
        example: { success: true, unread: 0 },
        statusCode: '200',
      };
    }
    if (path === '/api/reviews/my-reviews' && method === 'post') {
      return {
        summary: 'Get my reviews',
        description: 'Returns reviews related to the calling user/email context.',
        example: [{ id: 'rev_1', rating: 4, comment: 'Great food' }],
      };
    }
    if (path.includes('/admin/conversations') && method === 'get') {
      return {
        summary: 'Admin review conversations',
        description: 'Returns tenant admin review conversation list.',
        example: [{ id: 'rev_1', unreadCount: 2 }],
        statusCode: '200',
      };
    }
    if (path.includes('/admin/unread-count') && method === 'get') {
      return {
        summary: 'Admin unread review count',
        description: 'Returns unread conversation count for tenant admins.',
        example: { unreadCount: 3 },
        statusCode: '200',
      };
    }
    if (path.includes('/admin/') && path.endsWith('/conversation') && method === 'get') {
      return {
        summary: 'Admin review conversation detail',
        description: 'Returns one review conversation with replies for admin moderation.',
        example: { review: { id: 'rev_1', rating: 5 }, replies: [{ id: 'rpl_1', body: 'Thank you!' }] },
        statusCode: '200',
      };
    }
    if (path.includes('/admin/') && path.endsWith('/mark-read') && method === 'put') {
      return {
        summary: 'Admin mark review read',
        description: 'Marks tenant review conversation as read for admins.',
        example: { success: true },
        statusCode: '200',
      };
    }
    if (path === '/api/reviews/{id}' && method === 'get') {
      return {
        summary: 'Get review',
        description: 'Returns one tenant review by id.',
        example: { id: 'rev_1', rating: 5, comment: 'Amazing food' },
        statusCode: '200',
      };
    }
    if (path === '/api/reviews/{id}' && method === 'put') {
      return {
        summary: 'Update review',
        description: 'Updates a tenant review record.',
        example: { id: 'rev_1', approved: true },
        statusCode: '200',
      };
    }
    if (path === '/api/reviews/{id}' && method === 'delete') {
      return {
        summary: 'Delete review',
        description: 'Deletes a tenant review record.',
        example: { success: true },
        statusCode: '200',
      };
    }
    if (path.includes('/replies/') && method === 'delete') {
      return {
        summary: 'Delete review reply',
        description: 'Deletes a tenant review reply.',
        example: { success: true },
        statusCode: '200',
      };
    }
  }

  if (path.startsWith('/api/group-orders')) {
    if (path === '/api/group-orders' && method === 'get') {
      return {
        summary: 'List group orders',
        description: 'Returns tenant group orders (admin scope).',
        example: [{ id: 'go_1', name: 'Office Lunch', status: 'open' }],
        statusCode: '200',
      };
    }
    if (path === '/api/group-orders' && method === 'post') {
      return {
        summary: 'Create group order',
        description: 'Creates a tenant group order session.',
        example: { id: 'go_1', name: 'Office Lunch', status: 'open' },
      };
    }
    if (path === '/api/group-orders/{id}' && method === 'get') {
      return {
        summary: 'Get group order',
        description: 'Returns a tenant group order by id.',
        example: { id: 'go_1', status: 'open', items: [] },
        statusCode: '200',
      };
    }
    if (path === '/api/group-orders/{id}/items' && method === 'post') {
      return {
        summary: 'Add group order item',
        description: 'Adds participant item to tenant group order.',
        example: { id: 'go_item_1', groupOrderId: 'go_1', participantName: 'Pat', name: 'Plantains', qty: 1 },
      };
    }
    if (path === '/api/group-orders/{id}/items/{itemId}' && method === 'delete') {
      return {
        summary: 'Remove group order item',
        description: 'Removes one item from a tenant group order.',
        example: { success: true },
        statusCode: '200',
      };
    }
    if (path === '/api/group-orders/{id}/status' && method === 'put') {
      return {
        summary: 'Update group order status',
        description: 'Updates tenant group order lifecycle status.',
        example: { id: 'go_1', status: 'closed' },
        statusCode: '200',
      };
    }
    if (path === '/api/group-orders/{id}/participant/{participantName}' && method === 'get') {
      return {
        summary: 'Get participant items',
        description: 'Returns all group order items for one participant.',
        example: [{ id: 'go_item_1', participantName: 'Pat', name: 'Plantains', qty: 1 }],
        statusCode: '200',
      };
    }
  }

  if (path.startsWith('/api/delivery')) {
    if (path === '/api/delivery/request' && method === 'post') {
      return {
        summary: 'Create delivery request',
        description: 'Creates a delivery provider request for a paid tenant order.',
        example: { order_id: 'ord_1', provider: 'nash', status: 'created' },
      };
    }
    if (path === '/api/delivery/quote' && method === 'post') {
      return {
        summary: 'Get delivery quote',
        description: 'Fetches delivery pricing/eta quote for tenant order checkout.',
        example: { order_id: 'ord_1', quote_id: 'quote_1', fee_cents: 500, currency: 'usd' },
      };
    }
    if (path === '/api/delivery/webhook' && method === 'post') {
      return {
        summary: 'Tenant delivery webhook bridge',
        description: 'Processes delivery update payload through tenant-aware delivery handler.',
        example: { ok: true },
      };
    }
    if (path === '/api/delivery/{orderId}/status' && method === 'get') {
      return {
        summary: 'Get delivery status',
        description: 'Returns latest delivery status for a tenant order.',
        example: { order_id: 'ord_1', status: 'picked_up', eta: '12 min' },
        statusCode: '200',
      };
    }
  }

  if (path.startsWith('/api/tablet')) {
    if (path === '/api/tablet/activity' && method === 'post') {
      return {
        summary: 'Track tablet activity',
        description: 'Updates tenant tablet session activity, question count, and timeout state.',
        example: {
          sessionId: 'sess_1',
          tabletId: 'tenant_alpha::tab_1',
          questionCount: 3,
          remainingQuestions: 7,
          orderStatus: 'NONE',
          warningSent: false,
          showPreTimeoutWarning: false,
          sessionReset: false,
          clearCart: false,
          locked: false,
        },
      };
    }
    if (path === '/api/tablet/order-status' && method === 'post') {
      return {
        summary: 'Update tablet order status',
        description: 'Updates tenant tablet session order status while touching activity state.',
        example: {
          sessionId: 'sess_1',
          tabletId: 'tenant_alpha::tab_1',
          orderStatus: 'submitted',
          questionCount: 3,
          remainingQuestions: 7,
          warningSent: false,
          showPreTimeoutWarning: false,
          sessionReset: false,
          clearCart: false,
          locked: false,
        },
      };
    }
  }

  if (path.startsWith('/api/agent')) {
    if (path === '/api/agent/confirm_payment' && method === 'post') {
      return {
        summary: 'Confirm agent payment',
        description: 'Checks whether a tenant order generated from cart id is paid/exists.',
        example: { paid: true, order_id: 'ord_cart_123' },
      };
    }
    if (path === '/api/agent/generate_pickup_code' && method === 'post') {
      return {
        summary: 'Generate pickup code',
        description: 'Generates or returns pickup code for a tenant order.',
        example: { order_id: 'ord_1', pickup_code: '4829' },
      };
    }
  }

  if (path.startsWith('/api/orders')) {
    if (path === '/api/orders' && method === 'get') {
      return {
        summary: 'List legacy orders',
        description: 'Returns tenant legacy order records for admin compatibility views.',
        example: [{ id: 'ord_1', status: 'queued', channel: 'web', fulfillment: 'pickup' }],
        statusCode: '200',
      };
    }
    if (path === '/api/orders' && method === 'post') {
      return {
        summary: 'Create legacy order',
        description: 'Creates legacy-format tenant order for compatibility mode.',
        example: { id: 'ord_1', status: 'queued', channel: 'web', fulfillment: 'pickup' },
      };
    }
    if (path === '/api/orders/{id}' && method === 'get') {
      return {
        summary: 'Get legacy order',
        description: 'Returns one tenant legacy order.',
        example: { id: 'ord_1', status: 'queued', items: [{ name: 'Plantains', qty: 1 }] },
        statusCode: '200',
      };
    }
    if (path === '/api/orders/{id}' && method === 'put') {
      return {
        summary: 'Update legacy order',
        description: 'Updates one tenant legacy order record.',
        example: { id: 'ord_1', status: 'in_prep' },
        statusCode: '200',
      };
    }
    if (path === '/api/orders/{id}' && method === 'delete') {
      return {
        summary: 'Delete legacy order',
        description: 'Deletes one tenant legacy order record.',
        example: { success: true },
        statusCode: '200',
      };
    }
  }

  if (path.startsWith('/api/locations')) {
    if (path === '/api/locations' && method === 'post') {
      return {
        summary: 'Create location',
        description: 'Creates a tenant location.',
        example: { id: 'loc_1', name: 'Main Location', city: 'Portland', state: 'OR' },
      };
    }
    if (path === '/api/locations' && method === 'get') {
      return {
        summary: 'List locations',
        description: 'Returns locations for the current tenant.',
        example: [{ id: 'loc_1', name: 'Main Location', city: 'Portland', state: 'OR' }],
        statusCode: '200',
      };
    }
    if (path === '/api/locations/{id}' && method === 'get') {
      return {
        summary: 'Get location',
        description: 'Returns one tenant location.',
        example: { id: 'loc_1', name: 'Main Location', city: 'Portland', state: 'OR' },
        statusCode: '200',
      };
    }
  }

  return {
    summary: defaultSummary(method, path),
    description:
      'Tenant-aware API endpoint. Provide tenant context using JWT tenantId claim or `x-tenant-id`/`tenantId` input.',
    example: defaultExample(method, path),
  };
}

export function enrichSwaggerDocument<T extends SwaggerDocument>(document: T): T {
  const paths = document.paths || {};

  for (const [path, pathItem] of Object.entries(paths)) {
    for (const method of METHODS) {
      const operation = pathItem?.[method];
      if (!operation) continue;

      const template = templateForPath(method, path);
      operation.summary = template.summary;
      operation.description = template.description;

      ensureTenantHeader(path, operation);
      upsertSuccessResponse(operation, method, template);
      ensureCommonErrors(path, operation);
    }
  }

  document.paths = paths;
  return document;
}
