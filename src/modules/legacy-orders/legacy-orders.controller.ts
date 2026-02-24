import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LegacyOrdersService } from './legacy-orders.service';
import { CreateLegacyOrderDto } from './dto/create-legacy-order.dto';
import { UpdateLegacyOrderDto } from './dto/update-legacy-order.dto';
import { AuthGuard, AdminGuard } from '../auth/auth.guard';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import type { TenantContext } from '../../common/tenant/tenant.types';

@ApiTags('legacy-orders')
@Controller('orders')
@UseGuards(TenantRequiredGuard)
export class LegacyOrdersController {
  constructor(private readonly orders: LegacyOrdersService) {}

  @Get()
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async list(@CurrentTenant() tenant: TenantContext) {
    return this.orders.list(tenant.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async get(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.orders.get(tenant.id, id);
  }

  @Post()
  async create(@CurrentTenant() tenant: TenantContext, @Body() body: CreateLegacyOrderDto) {
    return this.orders.create(tenant.id, body);
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async update(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body() body: UpdateLegacyOrderDto) {
    return this.orders.update(tenant.id, id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async remove(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.orders.remove(tenant.id, id);
  }
}
