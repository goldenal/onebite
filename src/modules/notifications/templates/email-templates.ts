type TemplateLayout = {
  title: string;
  preheader: string;
  restaurantName: string;
  bodyHtml: string;
};

export type OrderReceiptItem = {
  name: string;
  quantity: number;
  unitPriceCents?: number | null;
};

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatCurrency = (cents: number, currency = 'USD') => {
  const safe = Number.isFinite(cents) ? cents : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(safe / 100);
};

const renderLayout = ({ title, preheader, restaurantName, bodyHtml }: TemplateLayout) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,sans-serif;color:#101828;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7fb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #eaecf0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:#111827;color:#ffffff;font-size:18px;font-weight:700;">${escapeHtml(restaurantName)}</td>
            </tr>
            <tr>
              <td style="padding:24px;line-height:1.55;font-size:15px;">${bodyHtml}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const reservationCreatedTemplate = (input: {
  restaurantName: string;
  customerName: string;
  guests: string;
  date: string;
  time: string;
  specialRequests?: string | null;
}) => {
  const subject = `${input.restaurantName}: Reservation Received`;
  const preheader = `Reservation for ${input.date} at ${input.time} was received.`;
  const details = [
    `<li><strong>Name:</strong> ${escapeHtml(input.customerName)}</li>`,
    `<li><strong>Guests:</strong> ${escapeHtml(input.guests)}</li>`,
    `<li><strong>Date:</strong> ${escapeHtml(input.date)}</li>`,
    `<li><strong>Time:</strong> ${escapeHtml(input.time)}</li>`,
  ];
  if (input.specialRequests) {
    details.push(`<li><strong>Special requests:</strong> ${escapeHtml(input.specialRequests)}</li>`);
  }

  const html = renderLayout({
    title: subject,
    preheader,
    restaurantName: input.restaurantName,
    bodyHtml: `<p>Hi ${escapeHtml(input.customerName)},</p>
      <p>We received your reservation request. Our team will review it shortly.</p>
      <ul>${details.join('')}</ul>
      <p>Thanks for choosing ${escapeHtml(input.restaurantName)}.</p>`,
  });

  const text = [
    `Hi ${input.customerName},`,
    `Your reservation request was received by ${input.restaurantName}.`,
    `Guests: ${input.guests}`,
    `Date: ${input.date}`,
    `Time: ${input.time}`,
    input.specialRequests ? `Special requests: ${input.specialRequests}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, html, text };
};

export const reservationStatusUpdatedTemplate = (input: {
  restaurantName: string;
  customerName: string;
  guests: string;
  date: string;
  time: string;
  status: string;
  notes?: string | null;
}) => {
  const normalizedStatus = input.status.replace(/_/g, ' ');
  const subject = `${input.restaurantName}: Reservation ${normalizedStatus}`;
  const preheader = `Your reservation status is now ${normalizedStatus}.`;

  const html = renderLayout({
    title: subject,
    preheader,
    restaurantName: input.restaurantName,
    bodyHtml: `<p>Hi ${escapeHtml(input.customerName)},</p>
      <p>Your reservation status is now <strong>${escapeHtml(normalizedStatus)}</strong>.</p>
      <ul>
        <li><strong>Guests:</strong> ${escapeHtml(input.guests)}</li>
        <li><strong>Date:</strong> ${escapeHtml(input.date)}</li>
        <li><strong>Time:</strong> ${escapeHtml(input.time)}</li>
      </ul>
      ${input.notes ? `<p><strong>Note from restaurant:</strong> ${escapeHtml(input.notes)}</p>` : ''}
      <p>If you need to make changes, please contact us directly.</p>`,
  });

  const text = [
    `Hi ${input.customerName},`,
    `Your reservation status is now ${normalizedStatus}.`,
    `Guests: ${input.guests}`,
    `Date: ${input.date}`,
    `Time: ${input.time}`,
    input.notes ? `Note: ${input.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, html, text };
};

export const ownerWelcomeTemplate = (input: {
  restaurantName: string;
  ownerEmail: string;
  tenantSlug: string;
  tenantDomain?: string | null;
  loginUrl: string;
}) => {
  const subject = `Welcome to ${input.restaurantName}`;
  const preheader = `Your owner account is linked to ${input.restaurantName}.`;

  const html = renderLayout({
    title: subject,
    preheader,
    restaurantName: input.restaurantName,
    bodyHtml: `<p>Hi,</p>
      <p>Your owner account <strong>${escapeHtml(input.ownerEmail)}</strong> is now linked to <strong>${escapeHtml(input.restaurantName)}</strong>.</p>
      <ul>
        <li><strong>Tenant slug:</strong> ${escapeHtml(input.tenantSlug)}</li>
        <li><strong>Primary domain:</strong> ${escapeHtml(input.tenantDomain || 'Not configured yet')}</li>
      </ul>
      <p><a href="${escapeHtml(input.loginUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:8px;">Open Dashboard</a></p>
      <p>Use your existing password to sign in.</p>`,
  });

  const text = [
    `Welcome to ${input.restaurantName}`,
    `Owner account: ${input.ownerEmail}`,
    `Tenant slug: ${input.tenantSlug}`,
    `Primary domain: ${input.tenantDomain || 'Not configured yet'}`,
    `Dashboard: ${input.loginUrl}`,
  ].join('\n');

  return { subject, html, text };
};

export const orderPaymentReceiptTemplate = (input: {
  restaurantName: string;
  customerName?: string | null;
  orderId: string;
  amountCents: number;
  subtotalCents?: number | null;
  taxCents?: number | null;
  deliveryFeeCents?: number | null;
  fulfillment?: string | null;
  items: OrderReceiptItem[];
  trackingUrl?: string | null;
}) => {
  const subject = `${input.restaurantName}: Payment Receipt (${input.orderId})`;
  const preheader = `Payment received for order ${input.orderId}.`;
  const itemLines = input.items
    .map((item) => {
      const unit = typeof item.unitPriceCents === 'number' ? ` - ${formatCurrency(item.unitPriceCents)}` : '';
      return `<li>${escapeHtml(item.name)} x ${item.quantity}${unit}</li>`;
    })
    .join('');

  const html = renderLayout({
    title: subject,
    preheader,
    restaurantName: input.restaurantName,
    bodyHtml: `<p>Hi ${escapeHtml(input.customerName || 'there')},</p>
      <p>We received your payment for order <strong>${escapeHtml(input.orderId)}</strong>.</p>
      <ul>
        <li><strong>Fulfillment:</strong> ${escapeHtml(input.fulfillment || 'pickup')}</li>
        <li><strong>Subtotal:</strong> ${formatCurrency(input.subtotalCents || 0)}</li>
        <li><strong>Tax:</strong> ${formatCurrency(input.taxCents || 0)}</li>
        <li><strong>Delivery fee:</strong> ${formatCurrency(input.deliveryFeeCents || 0)}</li>
        <li><strong>Total paid:</strong> ${formatCurrency(input.amountCents)}</li>
      </ul>
      ${itemLines ? `<p><strong>Items:</strong></p><ul>${itemLines}</ul>` : ''}
      ${input.trackingUrl ? `<p><a href="${escapeHtml(input.trackingUrl)}">Track your order</a></p>` : ''}`,
  });

  const text = [
    `Hi ${input.customerName || 'there'},`,
    `Payment received for order ${input.orderId}.`,
    `Fulfillment: ${input.fulfillment || 'pickup'}`,
    `Subtotal: ${formatCurrency(input.subtotalCents || 0)}`,
    `Tax: ${formatCurrency(input.taxCents || 0)}`,
    `Delivery fee: ${formatCurrency(input.deliveryFeeCents || 0)}`,
    `Total paid: ${formatCurrency(input.amountCents)}`,
    input.trackingUrl ? `Track order: ${input.trackingUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, html, text };
};

export const deliveryStatusUpdatedTemplate = (input: {
  restaurantName: string;
  customerName?: string | null;
  orderId: string;
  status: string;
  eta?: string | null;
  trackingUrl?: string | null;
}) => {
  const normalizedStatus = input.status.replace(/_/g, ' ');
  const subject = `${input.restaurantName}: Delivery update (${input.orderId})`;
  const preheader = `Delivery status changed to ${normalizedStatus}.`;

  const html = renderLayout({
    title: subject,
    preheader,
    restaurantName: input.restaurantName,
    bodyHtml: `<p>Hi ${escapeHtml(input.customerName || 'there')},</p>
      <p>Your delivery status for order <strong>${escapeHtml(input.orderId)}</strong> is now <strong>${escapeHtml(normalizedStatus)}</strong>.</p>
      ${input.eta ? `<p><strong>ETA:</strong> ${escapeHtml(input.eta)}</p>` : ''}
      ${input.trackingUrl ? `<p><a href="${escapeHtml(input.trackingUrl)}">Track your order</a></p>` : ''}`,
  });

  const text = [
    `Hi ${input.customerName || 'there'},`,
    `Delivery status for order ${input.orderId} is now ${normalizedStatus}.`,
    input.eta ? `ETA: ${input.eta}` : '',
    input.trackingUrl ? `Track order: ${input.trackingUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, html, text };
};

export const reviewAccessLinkTemplate = (input: {
  restaurantName: string;
  conversationLink: string;
}) => {
  const subject = `${input.restaurantName}: Review Access`;
  const preheader = 'Use this secure link to access your review conversation.';
  const html = renderLayout({
    title: subject,
    preheader,
    restaurantName: input.restaurantName,
    bodyHtml: `<p>Use this secure link to view your review conversation:</p>
      <p><a href="${escapeHtml(input.conversationLink)}">View Conversation</a></p>`,
  });
  const text = `Use this link to view your review conversation: ${input.conversationLink}`;
  return { subject, html, text };
};

export const reviewAdminReplyTemplate = (input: {
  restaurantName: string;
  customerName: string;
  adminMessage: string;
  conversationLink: string;
}) => {
  const subject = `${input.restaurantName}: Response to Your Review`;
  const preheader = 'The restaurant replied to your review.';
  const html = renderLayout({
    title: subject,
    preheader,
    restaurantName: input.restaurantName,
    bodyHtml: `<p>Dear ${escapeHtml(input.customerName)},</p>
      <p>We responded to your review:</p>
      <blockquote style="margin:12px 0;padding:12px;background:#f9fafb;border-left:4px solid #d0d5dd;">${escapeHtml(input.adminMessage)}</blockquote>
      <p><a href="${escapeHtml(input.conversationLink)}">View Conversation</a></p>`,
  });
  const text = [
    `Dear ${input.customerName},`,
    'We responded to your review.',
    input.adminMessage,
    `View conversation: ${input.conversationLink}`,
  ].join('\n');
  return { subject, html, text };
};
