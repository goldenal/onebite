import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { AuthGuard, AdminGuard } from '../auth/auth.guard';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';
import type { TenantContext } from '../../common/tenant/tenant.types';

@ApiTags('promotions')
@Controller('promotions')
@UseGuards(TenantRequiredGuard)
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get()
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async list(@CurrentTenant() tenant: TenantContext) {
    return this.promotions.list(tenant.id);
  }

  @Get('active')
  async listActive(@CurrentTenant() tenant: TenantContext) {
    return this.promotions.listActive(tenant.id);
  }

  @Get(':id')
  async get(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.promotions.get(tenant.id, id);
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async create(@CurrentTenant() tenant: TenantContext, @Body() body: CreatePromotionDto) {
    return this.promotions.create(tenant.id, body);
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async update(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body() body: UpdatePromotionDto) {
    return this.promotions.update(tenant.id, id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async remove(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.promotions.remove(tenant.id, id);
  }
}
