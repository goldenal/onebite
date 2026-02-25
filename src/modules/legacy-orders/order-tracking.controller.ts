import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import type { TenantContext } from '../../common/tenant/tenant.types';

@ApiTags('orders')
@Controller('orders')
@UseGuards(TenantRequiredGuard)
export class OrderTrackingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('track/:orderId')
  async track(@CurrentTenant() tenant: TenantContext, @Param('orderId') orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, tenantId: tenant.id } });
    if (!order) throw new NotFoundException('order_not_found');

    const audit = await this.prisma.auditEntry.findMany({
      where: { orderId, tenantId: tenant.id },
      orderBy: { ts: 'asc' },
      select: { ts: true, action: true, actor: true },
    });

    return {
      orderId: order.id,
      status: order.status,
      arrivalStatus: order.arrivalStatus,
      fulfillment: order.fulfillment,
      eta: order.prepEstimateMinutes,
      paidAt: order.paidAt.toISOString(),
      timeline: audit.map((entry) => ({
        ts: entry.ts.toISOString(),
        actor: entry.actor,
        action: entry.action,
      })),
    };
  }
}
