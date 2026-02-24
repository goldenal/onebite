import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { TenantContext } from './tenant.types';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  normalizeTenantId(input?: string | null) {
    if (!input) return null;
    const tenantId = input.trim();
    return tenantId || null;
  }

  private toContext(tenant: { id: string; slug: string; name: string; status: string }): TenantContext {
    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status as 'active' | 'suspended',
    };
  }

  async resolveById(tenantId?: string | null): Promise<TenantContext | null> {
    const normalizedTenantId = this.normalizeTenantId(tenantId);
    if (!normalizedTenantId) return null;

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: normalizedTenantId, status: 'active' },
      select: { id: true, slug: true, name: true, status: true },
    });
    if (!tenant) return null;
    return this.toContext(tenant);
  }
}
