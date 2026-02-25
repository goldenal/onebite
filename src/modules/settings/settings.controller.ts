import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import type { TenantContext } from '../../common/tenant/tenant.types';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';
import { AuthGuard, AdminGuard } from '../auth/auth.guard';

@ApiTags('settings')
@Controller('settings')
@UseGuards(TenantRequiredGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  async all(@CurrentTenant() tenant: TenantContext) {
    return this.settings.getAll(tenant.id);
  }

  @Get('contact')
  async contact(@CurrentTenant() tenant: TenantContext) {
    return (await this.settings.getSetting(tenant.id, 'contact')) || {};
  }

  @Get('hours')
  async hours(@CurrentTenant() tenant: TenantContext) {
    return (await this.settings.getSetting(tenant.id, 'hours')) || {};
  }

  @Get('about')
  async about(@CurrentTenant() tenant: TenantContext) {
    return (await this.settings.getSetting(tenant.id, 'about')) || {};
  }

  @Put('contact')
  @UseGuards(AuthGuard, AdminGuard())
  async putContact(@CurrentTenant() tenant: TenantContext, @Body() body: Record<string, unknown>) {
    const value = await this.settings.putSetting(tenant.id, 'contact', body || {});
    return { contact: value || {} };
  }

  @Put('hours')
  @UseGuards(AuthGuard, AdminGuard())
  async putHours(@CurrentTenant() tenant: TenantContext, @Body() body: Record<string, unknown>) {
    const value = await this.settings.putSetting(tenant.id, 'hours', body || {});
    return { hours: value || {} };
  }

  @Put('about')
  @UseGuards(AuthGuard, AdminGuard())
  async putAbout(@CurrentTenant() tenant: TenantContext, @Body() body: Record<string, unknown>) {
    const value = await this.settings.putSetting(tenant.id, 'about', body || {});
    return { about: value || {} };
  }
}
