import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantService } from '../../common/tenant/tenant.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantService,
    private readonly settings: SettingsService,
  ) {}

  async resolveTenant(tenantId?: string) {
    const tenant = await this.tenants.resolveById(tenantId);
    if (!tenant) throw new NotFoundException('tenant_not_found');

    const primaryDomain = await this.prisma.tenantDomain.findFirst({
      where: { tenantId: tenant.id, isPrimary: true },
      select: { domain: true, verifiedAt: true },
    });

    return {
      tenantId: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status,
      domain: primaryDomain?.domain ?? null,
      verifiedAt: primaryDomain?.verifiedAt?.toISOString() ?? null,
    };
  }

  async bootstrap(tenantId: string) {
    const [tenant, domain, defaultLocation, settings, featureFlags, faqs, policies] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, slug: true, name: true, status: true },
      }),
      this.prisma.tenantDomain.findFirst({
        where: { tenantId, isPrimary: true },
        select: { domain: true },
      }),
      this.prisma.location.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
      }),
      this.settings.getAll(tenantId),
      this.settings.getSetting(tenantId, 'feature_flags'),
      this.settings.getContent(tenantId, 'faqs'),
      this.settings.getContent(tenantId, 'policies'),
    ]);

    if (!tenant) throw new NotFoundException('tenant_not_found');

    return {
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        status: tenant.status,
        domain: domain?.domain ?? null,
      },
      branding: (await this.settings.getSetting(tenantId, 'branding')) || {},
      defaultLocation: defaultLocation
        ? {
            id: defaultLocation.id,
            name: defaultLocation.name,
            phone: defaultLocation.phone,
            address: {
              addressLine1: defaultLocation.addressLine1,
              addressLine2: defaultLocation.addressLine2,
              city: defaultLocation.city,
              state: defaultLocation.state,
              postalCode: defaultLocation.postalCode,
              country: defaultLocation.country,
            },
          }
        : null,
      featureFlags: featureFlags || {},
      settings,
      content: {
        faqs: faqs || [],
        policies: policies || {},
      },
    };
  }
}
