import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';
import type { TenantContext } from '../../common/tenant/tenant.types';
import { AdminGuard, AuthGuard } from '../auth/auth.guard';
import { PlatformService } from './platform.service';
import { CreateRestaurantLocationDto } from './dto/create-restaurant.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@ApiTags('business')
@ApiBearerAuth('bearer')
@Controller('business')
@UseGuards(TenantRequiredGuard, AuthGuard, AdminGuard())
export class BusinessController {
  constructor(private readonly platform: PlatformService) {}

  @Get('me')
  async me(@CurrentTenant() tenant: TenantContext) {
    return this.platform.getRestaurant(tenant.id);
  }

  @Patch('me')
  async updateBusiness(@CurrentTenant() tenant: TenantContext, @Body() body: UpdateBusinessDto) {
    return this.platform.updateRestaurant(tenant.id, body);
  }

  @Get('locations')
  async locations(@CurrentTenant() tenant: TenantContext) {
    return this.platform.listRestaurantLocations(tenant.id);
  }

  @Post('locations')
  async createLocation(@CurrentTenant() tenant: TenantContext, @Body() body: CreateRestaurantLocationDto) {
    return this.platform.createRestaurantLocation(tenant.id, body);
  }
}
