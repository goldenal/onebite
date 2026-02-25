import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GroupOrdersService } from './group-orders.service';
import { CreateGroupOrderDto } from './dto/create-group-order.dto';
import { AddGroupItemDto } from './dto/add-group-item.dto';
import { UpdateGroupStatusDto } from './dto/update-group-status.dto';
import { AuthGuard, AdminGuard } from '../auth/auth.guard';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';
import type { TenantContext } from '../../common/tenant/tenant.types';

@ApiTags('group-orders')
@Controller('group-orders')
@UseGuards(TenantRequiredGuard)
export class GroupOrdersController {
  constructor(private readonly groupOrders: GroupOrdersService) {}

  @Get()
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async listAdmin(@CurrentTenant() tenant: TenantContext) {
    return this.groupOrders.listAdmin(tenant.id);
  }

  @Get(':id')
  async get(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.groupOrders.get(tenant.id, id);
  }

  @Post()
  async create(@CurrentTenant() tenant: TenantContext, @Body() body: CreateGroupOrderDto) {
    return this.groupOrders.create(tenant.id, body);
  }

  @Post(':id/items')
  async addItem(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body() body: AddGroupItemDto) {
    return this.groupOrders.addItem(tenant.id, id, body);
  }

  @Delete(':id/items/:itemId')
  async removeItem(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.groupOrders.removeItem(tenant.id, id, itemId);
  }

  @Put(':id/status')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async updateStatus(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body() body: UpdateGroupStatusDto) {
    return this.groupOrders.updateStatus(tenant.id, id, body);
  }

  @Get(':id/participant/:participantName')
  async participantItems(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Param('participantName') participantName: string,
  ) {
    return this.groupOrders.participantItems(tenant.id, id, participantName);
  }
}
