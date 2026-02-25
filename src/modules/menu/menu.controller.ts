import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { AuthGuard, AdminGuard } from '../auth/auth.guard';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import type { TenantContext } from '../../common/tenant/tenant.types';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';

@ApiTags('menu')
@Controller('menu')
@UseGuards(TenantRequiredGuard)
export class MenuController {
  constructor(private readonly menu: MenuService) {}

  @Get()
  async list(@CurrentTenant() tenant: TenantContext) {
    return this.menu.listMenu(tenant.id);
  }

  @Get(':id')
  async getOne(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    const item = await this.menu.getMenuItem(tenant.id, id);
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async create(@CurrentTenant() tenant: TenantContext, @Body() body: CreateMenuItemDto) {
    return this.menu.createMenuItem(tenant.id, body);
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async update(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body() body: UpdateMenuItemDto) {
    return this.menu.updateMenuItem(tenant.id, id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async remove(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.menu.deleteMenuItem(tenant.id, id);
  }
}
