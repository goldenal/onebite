import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import type { TenantContext } from '../../common/tenant/tenant.types';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private readonly service: PublicService) {}

  @Get('tenant/resolve')
  @ApiQuery({
    name: 'tenantId',
    required: true,
    description: 'Tenant ID to resolve.',
    example: 'tenant_alpha',
  })
  async resolve(@Query('tenantId') tenantId?: string) {
    return this.service.resolveTenant(tenantId);
  }

  @Get('tenant/bootstrap')
  @UseGuards(TenantRequiredGuard)
  @ApiQuery({
    name: 'tenantId',
    required: false,
    description: 'Tenant ID fallback when no bearer token or x-tenant-id header is provided.',
    example: 'tenant_alpha',
  })
  async bootstrap(@CurrentTenant() tenant: TenantContext, @Query('tenantId') _tenantId?: string) {
    return this.service.bootstrap(tenant.id);
  }
}
