import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { randomUUID } from 'crypto';
import Stripe from 'stripe';
import bcrypt from 'bcryptjs';
import { CreateRestaurantDto, CreateRestaurantLocationDto } from './dto/create-restaurant.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PlatformService {
  private stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly auth: AuthService,
    private readonly notifications: NotificationsService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
  }

  login(username: string, password: string) {
    const expectedUsername = this.config.get<string>('PLATFORM_ADMIN_USERNAME') || '';
    const expectedPassword = this.config.get<string>('PLATFORM_ADMIN_PASSWORD') || '';
    if (!expectedUsername || !expectedPassword) throw new ForbiddenException('platform_auth_not_configured');
    if (username !== expectedUsername || password !== expectedPassword) {
      throw new ForbiddenException('invalid_credentials');
    }

    const token = this.auth.signToken({
      sub: 'platform_admin',
      role: 'platform',
      username,
    });

    return { success: true, token, role: 'platform' };
  }

  async listRestaurants() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        domains: { orderBy: { isPrimary: 'desc' } },
        stripeAccount: true,
      },
    });
  }

  async createRestaurant(body: CreateRestaurantDto) {
    const providedSlug = body.slug?.trim().toLowerCase();
    const normalizedSlug = providedSlug && providedSlug.length ? providedSlug : `tenant-${randomUUID().slice(0, 8)}`;
    const tenantId = `tenant_${normalizedSlug.replace(/[^a-z0-9_-]/gi, '')}`;
    const ownerEmailRaw = body.owner_email || body.ownerEmail || null;
    const ownerPassword = body.owner_password || body.ownerPassword || null;
    const ownerEmail = ownerEmailRaw ? ownerEmailRaw.trim().toLowerCase() : null;

    if ((ownerEmail && !ownerPassword) || (!ownerEmail && ownerPassword)) {
      throw new ForbiddenException('owner_email_and_password_required_together');
    }

    const ownerContext = ownerEmail && ownerPassword ? await this.resolveOwnerUser(ownerEmail, ownerPassword) : null;

    const createdTenantId = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          id: tenantId,
          slug: normalizedSlug,
          name: body.name,
          status: body.status || 'active',
        },
      });

      if (body.domain) {
        await tx.tenantDomain.create({
          data: {
            id: `td_${randomUUID()}`,
            tenantId: tenant.id,
            domain: body.domain,
            isPrimary: true,
            verifiedAt: null,
          },
        });
      }

      await tx.tenantStripeAccount.upsert({
        where: { tenantId: tenant.id },
        update: {},
        create: {
          tenantId: tenant.id,
          connectAccountId: null,
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false,
          onboardingComplete: false,
        },
      });

      await tx.location.create({
        data: {
          id: `loc_${randomUUID()}`,
          tenantId: tenant.id,
          name: body.location.name,
          phone: body.location.phone,
          addressLine1: body.location.address_line1,
          addressLine2: body.location.address_line2 || null,
          city: body.location.city,
          state: body.location.state,
          postalCode: body.location.postal_code,
          country: body.location.country,
        },
      });

      if (ownerContext) {
        await tx.tenantMembership.upsert({
          where: {
            tenantId_userId: {
              tenantId: tenant.id,
              userId: ownerContext.userId,
            },
          },
          update: {
            role: 'owner',
            locationIds: [],
            updatedAt: new Date(),
          },
          create: {
            id: `tm_${randomUUID()}`,
            tenantId: tenant.id,
            userId: ownerContext.userId,
            role: 'owner',
            locationIds: [],
          },
        });
      }

      return tenant.id;
    });

    const tenant = await this.getRestaurant(createdTenantId);
    if (!ownerContext) return tenant;

    await this.notifications.sendOwnerWelcome({
      tenantId: createdTenantId,
      to: ownerContext.email,
      ownerEmail: ownerContext.email,
    });

    const token = this.auth.signToken({
      sub: ownerContext.userId,
      role: 'admin',
      tenantId: createdTenantId,
      username: ownerContext.email,
      email: ownerContext.email,
      locationIds: [],
    });

    return {
      ...tenant,
      owner: {
        email: ownerContext.email,
        role: 'owner',
      },
      auth: {
        token,
        role: 'admin',
      },
    };
  }

  async getRestaurant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        domains: { orderBy: { isPrimary: 'desc' } },
        stripeAccount: true,
        locations: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!tenant) throw new NotFoundException('tenant_not_found');
    return tenant;
  }

  async updateRestaurant(tenantId: string, body: UpdateBusinessDto) {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        slug: body.slug,
        name: body.name,
        status: body.status,
        updatedAt: new Date(),
      },
    });
    return this.getRestaurant(tenantId);
  }

  async createRestaurantLocation(
    tenantId: string,
    body: CreateRestaurantLocationDto,
  ) {
    const location = await this.prisma.location.create({
      data: {
        id: body.id || `loc_${randomUUID()}`,
        tenantId,
        name: body.name,
        phone: body.phone,
        addressLine1: body.address_line1,
        addressLine2: body.address_line2 || null,
        city: body.city,
        state: body.state,
        postalCode: body.postal_code,
        country: body.country,
      },
    });
    return location;
  }

  async listRestaurantLocations(tenantId: string) {
    return this.prisma.location.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
  }

  async createConnectAccount(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('tenant_not_found');

    const existing = await this.prisma.tenantStripeAccount.findUnique({ where: { tenantId } });
    if (existing?.connectAccountId) {
      const accountLink = await this.stripe.accountLinks.create({
        account: existing.connectAccountId,
        refresh_url: this.config.get<string>('STRIPE_CONNECT_REFRESH_URL') || 'http://localhost:5173/platform/connect/refresh',
        return_url: this.config.get<string>('STRIPE_CONNECT_RETURN_URL') || 'http://localhost:5173/platform/connect/return',
        type: 'account_onboarding',
      });
      return {
        tenantId,
        connectAccountId: existing.connectAccountId,
        onboardingUrl: accountLink.url,
      };
    }

    const account = await this.stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: `${tenant.slug}@example.com`,
      business_type: 'company',
      metadata: {
        tenant_id: tenant.id,
        tenant_slug: tenant.slug,
      },
    });

    const accountLink = await this.stripe.accountLinks.create({
      account: account.id,
      refresh_url: this.config.get<string>('STRIPE_CONNECT_REFRESH_URL') || 'http://localhost:5173/platform/connect/refresh',
      return_url: this.config.get<string>('STRIPE_CONNECT_RETURN_URL') || 'http://localhost:5173/platform/connect/return',
      type: 'account_onboarding',
    });

    await this.prisma.tenantStripeAccount.upsert({
      where: { tenantId },
      update: {
        connectAccountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        onboardingComplete: Boolean(account.details_submitted && account.charges_enabled),
        updatedAt: new Date(),
      },
      create: {
        tenantId,
        connectAccountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        onboardingComplete: Boolean(account.details_submitted && account.charges_enabled),
      },
    });

    return {
      tenantId,
      connectAccountId: account.id,
      onboardingUrl: accountLink.url,
    };
  }

  async connectStatus(tenantId: string) {
    const row = await this.prisma.tenantStripeAccount.findUnique({ where: { tenantId } });
    if (!row) throw new NotFoundException('stripe_account_not_found');
    return this.refreshConnectStatusFromStripe(row);
  }

  async handleConnectWebhook(accountId: string) {
    const row = await this.prisma.tenantStripeAccount.findFirst({ where: { connectAccountId: accountId } });
    if (!row) return null;

    return this.refreshConnectStatusFromStripe(row);
  }

  private async refreshConnectStatusFromStripe(row: {
    tenantId: string;
    connectAccountId: string | null;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    onboardingComplete: boolean;
  }) {
    // No connected account yet; return the persisted placeholder state.
    if (!row.connectAccountId) return row;

    try {
      const account = await this.stripe.accounts.retrieve(row.connectAccountId);
      if ('deleted' in account && account.deleted) return row;

      return this.prisma.tenantStripeAccount.update({
        where: { tenantId: row.tenantId },
        data: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          onboardingComplete: Boolean(account.details_submitted && account.charges_enabled),
          updatedAt: new Date(),
        },
      });
    } catch {
      // Fallback to last known DB state when Stripe is temporarily unavailable.
      return row;
    }
  }

  private async resolveOwnerUser(email: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      const ok = await bcrypt.compare(password, existing.passwordHash);
      if (!ok) throw new ForbiddenException('owner_credentials_conflict');
      return { userId: existing.id, email: existing.email };
    }

    const hash = await bcrypt.hash(password, 10);
    const created = await this.prisma.user.create({
      data: {
        id: `usr_${randomUUID()}`,
        email,
        passwordHash: hash,
      },
    });
    return { userId: created.id, email: created.email };
  }
}
