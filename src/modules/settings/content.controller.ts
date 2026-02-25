import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import type { TenantContext } from '../../common/tenant/tenant.types';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';
import { AuthGuard, AdminGuard } from '../auth/auth.guard';

@ApiTags('content')
@Controller('content')
@UseGuards(TenantRequiredGuard)
export class ContentController {
  constructor(private readonly settings: SettingsService) {}

  @Put('faqs')
  @UseGuards(AuthGuard, AdminGuard())
  async putFaqs(@CurrentTenant() tenant: TenantContext, @Body() body: unknown) {
    const value = await this.settings.putContent(tenant.id, 'faqs', body || []);
    return { faqs: value || [] };
  }

  @Get('policies')
  async getPolicies(@CurrentTenant() tenant: TenantContext) {
    const value = await this.settings.getContent(tenant.id, 'policies');
    return { policies: value || {} };
  }

  @Put('policies')
  @UseGuards(AuthGuard, AdminGuard())
  async putPolicies(@CurrentTenant() tenant: TenantContext, @Body() body: unknown) {
    const value = await this.settings.putContent(tenant.id, 'policies', body || {});
    return { policies: value || {} };
  }
}
