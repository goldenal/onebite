import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type StructuredAddressInput = {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

type CheapestQuote = {
  quote: any;
  quoteId: string;
  feeCents: number;
  currency: string;
  eta: string | null;
  expiresAt: Date | null;
};

type QuoteCandidate = {
  quote: any;
  quoteId: string;
  feeCents: number;
  expiresAt: Date | null;
};

@Injectable()
export class NashService {
  constructor(private readonly config: ConfigService) {}

  private get apiBase() {
    return (this.config.get<string>('NASH_API_BASE') || 'https://api.sandbox.usenash.com').replace(/\/+$/, '');
  }

  private get getQuotesPath() {
    return this.config.get<string>('NASH_GET_QUOTES_PATH') || '/v1/order/get_quotes';
  }

  private get selectQuotePath() {
    return this.config.get<string>('NASH_SELECT_QUOTE_PATH') || '/v1/select_quote';
  }

  private requestTimeoutMs() {
    return Number(this.config.get<string>('NASH_TIMEOUT_MS') || 8000);
  }

  private defaultValueCents() {
    const parsed = Number(this.config.get<string>('NASH_DEFAULT_VALUE_CENTS') || 1000);
    if (!Number.isFinite(parsed)) return 1000;
    return Math.max(1, Math.round(parsed));
  }

  private defaultDeliveryMode() {
    const mode = String(this.config.get<string>('NASH_DELIVERY_MODE') || 'now').trim();
    return mode || 'now';
  }

  private buildUrl(path: string) {
    return `${this.apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private async fetchWithTimeout(url: string, init: RequestInit, timeoutMs = this.requestTimeoutMs()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  private getAuthHeaders() {
    const tokenRaw = (this.config.get<string>('NASH_BEARER_TOKEN') || this.config.get<string>('NASH_API_TOKEN') || '').trim();
    const apiKey = (this.config.get<string>('NASH_API_KEY') || '').trim();
    const orgId = (this.config.get<string>('NASH_ORG_ID') || '').trim();

    if (!tokenRaw && !apiKey) {
      throw new Error('NASH_API_TOKEN or NASH_API_KEY required');
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (tokenRaw) headers.Authorization = tokenRaw.startsWith('Bearer ') ? tokenRaw : `Bearer ${tokenRaw}`;
    if (apiKey) headers['x-api-key'] = apiKey;
    if (orgId) headers['x-org-id'] = orgId;
    return headers;
  }

  private formatAddress(address: StructuredAddressInput) {
    return [address.address_line1, address.address_line2, `${address.city}, ${address.state} ${address.postal_code}`, address.country]
      .filter((part) => Boolean(part && String(part).trim()))
      .join(', ');
  }

  private splitName(value?: string) {
    const full = (value || '').trim();
    if (!full) return { firstName: '', lastName: '' };
    const [firstName, ...rest] = full.split(/\s+/);
    return { firstName, lastName: rest.join(' ') };
  }

  private toNumber(value: unknown) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toIsoEta(value: unknown) {
    if (value == null) return null;
    if (typeof value === 'string') return value;
    const numeric = this.toNumber(value);
    if (numeric == null) return null;
    return `${Math.max(0, Math.round(numeric))} minutes`;
  }

  private parseDate(value: unknown) {
    if (typeof value !== 'string' || !value.trim()) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  }

  private readQuotePriceCents(quote: any) {
    const breakdown = quote?.totalPriceBreakdown || quote?.total_price_breakdown || {};
    const candidates = [
      quote?.totalPriceCents,
      quote?.priceCents,
      quote?.feeCents,
      quote?.total_price_cents,
      quote?.price_cents,
      quote?.fee_cents,
      breakdown?.totalPriceCents,
      breakdown?.priceCents,
      breakdown?.feeCents,
      quote?.fee?.amount,
      quote?.fee?.value,
      quote?.fee,
    ];

    for (const candidate of candidates) {
      const parsed = this.toNumber(candidate);
      if (parsed != null) return Math.max(0, Math.round(parsed));
    }
    return Number.POSITIVE_INFINITY;
  }

  private extractQuotes(data: any): any[] {
    if (Array.isArray(data?.quotes)) return data.quotes;
    if (Array.isArray(data?.order?.quotes)) return data.order.quotes;
    if (Array.isArray(data?.data?.quotes)) return data.data.quotes;
    return [];
  }

  private quoteId(quote: any) {
    return String(quote?.quoteId || quote?.quote_id || quote?.id || '').trim();
  }

  private quoteCurrency(data: any, quote: any) {
    return String(quote?.currency || data?.currency || data?.order?.currency || 'USD');
  }

  private quoteEta(data: any, quote: any) {
    return (
      this.toIsoEta(quote?.dropoffEta) ||
      this.toIsoEta(quote?.dropoff_eta) ||
      this.toIsoEta(quote?.etaMinutes) ||
      this.toIsoEta(data?.dropoffEta) ||
      this.toIsoEta(data?.eta) ||
      null
    );
  }

  private quoteExpiresAt(quote: any) {
    return this.parseDate(quote?.expireTime) || this.parseDate(quote?.expiresAt) || this.parseDate(quote?.expires_at) || null;
  }

  extractOrderId(data: any) {
    const value = data?.orderId || data?.order_id || data?.id || data?.order?.id || data?.data?.orderId || data?.data?.id || null;
    const normalized = String(value || '').trim();
    return normalized || null;
  }

  selectCheapestQuote(data: any): CheapestQuote {
    const quotes = this.extractQuotes(data);
    if (!quotes.length) throw new Error('Nash returned no quotes');

    const candidates: QuoteCandidate[] = quotes
      .map((quote) => ({
        quote,
        quoteId: this.quoteId(quote),
        feeCents: this.readQuotePriceCents(quote),
        expiresAt: this.quoteExpiresAt(quote),
      }))
      .filter((candidate) => Boolean(candidate.quoteId) && Number.isFinite(candidate.feeCents));

    if (!candidates.length) throw new Error('Nash returned invalid quote data');

    const now = Date.now();
    const nonExpired = candidates.filter((candidate) => !candidate.expiresAt || candidate.expiresAt.getTime() > now);
    if (!nonExpired.length) throw new Error('Nash returned only expired quotes');

    const sorted = [...nonExpired].sort((a, b) => a.feeCents - b.feeCents);
    const selected = sorted[0];
    const quote = selected.quote;
    const quoteId = selected.quoteId;
    const feeCents = selected.feeCents;

    return {
      quote,
      quoteId,
      feeCents: Math.max(0, Math.round(feeCents)),
      currency: this.quoteCurrency(data, quote),
      eta: this.quoteEta(data, quote),
      expiresAt: selected.expiresAt,
    };
  }

  async createQuote(params: {
    externalId?: string;
    pickupAddress: StructuredAddressInput;
    dropoffAddress: StructuredAddressInput;
    pickupBusinessName?: string;
    pickupPhoneNumber?: string;
    dropoffName?: string;
    dropoffPhoneNumber?: string;
    dropoffInstructions?: string;
    valueCents?: number;
    deliveryMode?: string;
  }) {
    const names = this.splitName(params.dropoffName);
    const valueCents = Number.isFinite(Number(params.valueCents))
      ? Math.max(1, Math.round(Number(params.valueCents)))
      : this.defaultValueCents();

    const payload: Record<string, unknown> = {
      pickupAddress: this.formatAddress(params.pickupAddress),
      dropoffAddress: this.formatAddress(params.dropoffAddress),
      valueCents,
      deliveryMode: params.deliveryMode || this.defaultDeliveryMode(),
    };
    if (params.externalId) payload.externalId = params.externalId;
    if (params.pickupBusinessName) payload.pickupBusinessName = params.pickupBusinessName;
    if (params.pickupPhoneNumber) payload.pickupPhoneNumber = params.pickupPhoneNumber;
    if (params.dropoffPhoneNumber) payload.dropoffPhoneNumber = params.dropoffPhoneNumber;
    if (params.dropoffInstructions) payload.dropoffInstructions = params.dropoffInstructions;
    if (names.firstName) payload.dropoffFirstName = names.firstName;
    if (names.lastName) payload.dropoffLastName = names.lastName;
    if (!names.firstName) payload.dropoffBusinessName = 'Customer';

    const resp = await this.fetchWithTimeout(this.buildUrl(this.getQuotesPath), {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(`Nash quote failed: ${resp.status} ${JSON.stringify(data)}`);
    return data;
  }

  async selectQuote(params: { quoteId: string; orderId?: string }) {
    const payload: Record<string, unknown> = { quoteId: params.quoteId };
    if (params.orderId) payload.orderId = params.orderId;

    const resp = await this.fetchWithTimeout(this.buildUrl(this.selectQuotePath), {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(`Nash select quote failed: ${resp.status} ${JSON.stringify(data)}`);
    return data;
  }

  extractDeliveryResult(data: any) {
    const deliveryId = String(
      data?.deliveryId ||
        data?.delivery_id ||
        data?.id ||
        data?.jobId ||
        data?.job?.id ||
        data?.taskId ||
        data?.task?.id ||
        '',
    ).trim();

    const status =
      String(
        data?.status ||
          data?.deliveryStatus ||
          data?.delivery_status ||
          data?.job?.status ||
          data?.task?.status ||
          data?.event ||
          'pending',
      ).trim() || 'pending';

    const eta = this.toIsoEta(data?.dropoffEta) || this.toIsoEta(data?.dropoff_eta) || this.toIsoEta(data?.eta) || null;
    return { deliveryId, status, eta };
  }
}
