import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AuthGuard, AdminGuard } from '../auth/auth.guard';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import type { TenantContext } from '../../common/tenant/tenant.types';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(TenantRequiredGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  async list(@CurrentTenant() tenant: TenantContext) {
    return this.inventory.list(tenant.id);
  }

  @Get(':itemId')
  async get(@CurrentTenant() tenant: TenantContext, @Param('itemId') itemId: string) {
    return this.inventory.get(tenant.id, itemId);
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async create(@CurrentTenant() tenant: TenantContext, @Body() body: CreateInventoryDto) {
    return this.inventory.create(tenant.id, body);
  }

  @Put(':itemId')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async update(@CurrentTenant() tenant: TenantContext, @Param('itemId') itemId: string, @Body() body: UpdateInventoryDto) {
    return this.inventory.update(tenant.id, itemId, body);
  }

  @Delete(':itemId')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async remove(@CurrentTenant() tenant: TenantContext, @Param('itemId') itemId: string) {
    return this.inventory.remove(tenant.id, itemId);
  }
}
