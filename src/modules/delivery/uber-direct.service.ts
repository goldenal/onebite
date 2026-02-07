import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type UberAddress = {
  street_address: string[];
  city: string;
  state: string;
  zip_code: string;
  country: string;
};

@Injectable()
export class UberDirectService {
  private accessToken?: string;
  private accessTokenExpiresAt?: number;

  constructor(private readonly config: ConfigService) {}

  private get apiBase() {
    return this.config.get<string>('UBER_DIRECT_API_BASE') || 'https://api.uber.com';
  }

  private get authBase() {
    return this.config.get<string>('UBER_DIRECT_AUTH_BASE') || 'https://auth.uber.com';
  }

  private get customerId() {
    return this.config.get<string>('UBER_DIRECT_CUSTOMER_ID') || '';
  }

  private async getAccessToken() {
    if (this.accessToken && this.accessTokenExpiresAt && Date.now() < this.accessTokenExpiresAt - 60_000) {
      return this.accessToken;
    }
    const clientId = this.config.get<string>('UBER_DIRECT_CLIENT_ID');
    const clientSecret = this.config.get<string>('UBER_DIRECT_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      throw new Error('UBER_DIRECT_CLIENT_ID and UBER_DIRECT_CLIENT_SECRET required');
    }

    const scope = this.config.get<string>('UBER_DIRECT_OAUTH_SCOPE') || 'eats.organizations';
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope,
    });

    const resp = await fetch(`${this.authBase}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Uber auth failed: ${resp.status} ${text}`);
    }

    const data = await resp.json();
    this.accessToken = data.access_token;
    this.accessTokenExpiresAt = Date.now() + Number(data.expires_in || 0) * 1000;
    return this.accessToken;
  }

  toUberAddress(address: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  }): UberAddress {
    const street = [address.address_line1];
    if (address.address_line2) street.push(address.address_line2);
    return {
      street_address: street,
      city: address.city,
      state: address.state,
      zip_code: address.postal_code,
      country: address.country,
    };
  }

  async createQuote(params: { pickup: UberAddress; dropoff: UberAddress }) {
    const token = await this.getAccessToken();
    if (!this.customerId) throw new Error('UBER_DIRECT_CUSTOMER_ID required');

    const resp = await fetch(`${this.apiBase}/v1/customers/${this.customerId}/delivery_quotes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pickup_address: JSON.stringify(params.pickup),
        dropoff_address: JSON.stringify(params.dropoff),
      }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(`Uber quote failed: ${resp.status} ${JSON.stringify(data)}`);
    }
    return data;
  }

  async createDelivery(params: {
    quote_id: string;
    pickup_name: string;
    pickup_phone_number: string;
    pickup_address: UberAddress;
    dropoff_name: string;
    dropoff_phone_number: string;
    dropoff_address: UberAddress;
    manifest_items: Array<{ name: string; quantity: number; size?: string; price?: number }>;
    dropoff_notes?: string;
  }) {
    const token = await this.getAccessToken();
    if (!this.customerId) throw new Error('UBER_DIRECT_CUSTOMER_ID required');

    const payload: any = {
      quote_id: params.quote_id,
      pickup_name: params.pickup_name,
      pickup_phone_number: params.pickup_phone_number,
      pickup_address: JSON.stringify(params.pickup_address),
      dropoff_name: params.dropoff_name,
      dropoff_phone_number: params.dropoff_phone_number,
      dropoff_address: JSON.stringify(params.dropoff_address),
      manifest_items: params.manifest_items,
    };
    if (params.dropoff_notes) payload.dropoff_notes = params.dropoff_notes;

    const resp = await fetch(`${this.apiBase}/v1/customers/${this.customerId}/deliveries`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(`Uber delivery failed: ${resp.status} ${JSON.stringify(data)}`);
    }
    return data;
  }
}
