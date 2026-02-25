import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { LocationCreateDto } from './dto/location-create.dto';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import type { TenantContext } from '../../common/tenant/tenant.types';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';
import { UseGuards } from '@nestjs/common';

@ApiTags('locations')
@Controller('locations')
@UseGuards(TenantRequiredGuard)
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Post()
  async create(@CurrentTenant() tenant: TenantContext, @Body() body: LocationCreateDto) {
    return this.locations.create(tenant.id, body);
  }

  @Get()
  async list(@CurrentTenant() tenant: TenantContext) {
    return this.locations.list(tenant.id);
  }

  @Get(':id')
  async get(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.locations.get(tenant.id, id);
  }
}
