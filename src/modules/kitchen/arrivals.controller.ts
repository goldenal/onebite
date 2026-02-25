import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { KitchenService } from './kitchen.service';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import type { TenantContext } from '../../common/tenant/tenant.types';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';
import { KitchenAccessGuard } from '../auth/auth.guard';

@ApiTags('arrivals')
@Controller('arrivals')
@UseGuards(TenantRequiredGuard, KitchenAccessGuard)
export class ArrivalsController {
  constructor(private readonly kitchen: KitchenService) {}

  @Post(':orderId')
  async arrive(@CurrentTenant() tenant: TenantContext, @Param('orderId') orderId: string) {
    const updated = await this.kitchen.updateArrival(tenant.id, orderId);
    return { arrival_status: updated?.arrival_status, order_id: orderId };
  }
}
