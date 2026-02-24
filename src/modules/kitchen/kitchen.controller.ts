import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { KitchenService } from './kitchen.service';
import { KitchenAccessGuard } from '../auth/auth.guard';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import type { TenantContext } from '../../common/tenant/tenant.types';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';

@ApiTags('kitchen')
@ApiBearerAuth('bearer')
@Controller('kitchen')
@UseGuards(TenantRequiredGuard)
export class KitchenController {
  constructor(private readonly kitchen: KitchenService) {}

  @Get('stream')
  @UseGuards(KitchenAccessGuard)
  async stream(@Req() req: Request, @Res() res: Response, @CurrentTenant() tenant: TenantContext) {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.flushHeaders();
    res.write('retry: 5000\n\n');

    const initialOrders = await this.kitchen.listOrders(tenant.id);
    res.write(`data: ${JSON.stringify({ type: 'orders.snapshot', orders: initialOrders })}\n\n`);

    const { streamHub } = await import('../../common/stream/stream-hub');
    const clientId = streamHub.register(
      res,
      (message) => !message.tenantId || message.tenantId === tenant.id,
      (message) => {
        const { tenantId, ...payload } = message as Record<string, unknown>;
        return payload;
      },
    );

    const interval = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(interval);
      streamHub.unregister(clientId);
    });
  }

  @Get('orders/:id/status')
  @UseGuards(KitchenAccessGuard)
  async getOrderStatus(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    const order = await this.kitchen.getOrder(tenant.id, id);
    if (!order) return null;
    return {
      order_id: order.id,
      status: order.status,
      arrival_status: order.arrival_status,
      fulfillment: order.fulfillment,
      channel: order.channel,
    };
  }

  @Get('orders')
  @UseGuards(KitchenAccessGuard)
  async list(
    @CurrentTenant() tenant: TenantContext,
    @Query('status') status?: string,
    @Query('channel') channel?: string,
    @Query('fulfillment') fulfillment?: string,
  ) {
    const orders = await this.kitchen.listOrders(tenant.id, {
      status: status as any,
      channel: channel as any,
      fulfillment: fulfillment as any,
    });
    return { orders };
  }

  @Get('orders/:id')
  @UseGuards(KitchenAccessGuard)
  async getOrder(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.kitchen.getOrder(tenant.id, id);
  }

  @Post('orders/:id/start')
  @UseGuards(KitchenAccessGuard)
  async start(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.kitchen.updateStatus(tenant.id, id, 'in_prep');
  }

  @Post('orders/:id/ready')
  @UseGuards(KitchenAccessGuard)
  async ready(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.kitchen.updateStatus(tenant.id, id, 'ready_waiting_arrival');
  }

  @Post('orders/:id/serve')
  @UseGuards(KitchenAccessGuard)
  async serve(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.kitchen.updateStatus(tenant.id, id, 'served');
  }

  @Post('orders/:id/deliver')
  @UseGuards(KitchenAccessGuard)
  async deliver(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.kitchen.updateStatus(tenant.id, id, 'delivered');
  }

  @Post('orders/:id/hold')
  @UseGuards(KitchenAccessGuard)
  async hold(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.kitchen.updateStatus(tenant.id, id, 'on_hold');
  }

  @Post('orders/:id/resume')
  @UseGuards(KitchenAccessGuard)
  async resume(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.kitchen.updateStatus(tenant.id, id, 'in_prep');
  }

  @Post('orders/:id/cancel')
  @UseGuards(KitchenAccessGuard)
  async cancel(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.kitchen.updateStatus(tenant.id, id, 'canceled');
  }

  @Post('orders/:id/arrive')
  @UseGuards(KitchenAccessGuard)
  async arrive(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.kitchen.updateArrival(tenant.id, id);
  }

  @Post('orders/:id/refire')
  @UseGuards(KitchenAccessGuard)
  @ApiBody({ schema: { example: { items: ['item_1'], reason: 'Overcooked' } } })
  async refire(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body() body: { items?: string[]; reason?: string }) {
    return this.kitchen.refire(tenant.id, id, body?.items, body?.reason);
  }

  @Post('orders/:id/edit')
  @UseGuards(KitchenAccessGuard)
  @ApiBody({
    schema: {
      example: {
        items: [{ name: 'Jerk Chicken Plate', qty: 1, modifiers: ['Mild'], allergies: [], station: 'grill' }],
        priority_flag: false,
        prep_estimate_minutes: 20,
      },
    },
  })
  async edit(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: { items: any[]; priority_flag?: boolean; prep_estimate_minutes?: number | null },
  ) {
    const items = Array.isArray(body?.items)
      ? body.items
          .map((i: any) => ({
            name: String(i.name || '').trim(),
            qty: Number(i.qty) || 1,
            modifiers: Array.isArray(i.modifiers) ? i.modifiers : [],
            allergies: Array.isArray(i.allergies) ? i.allergies : [],
            station: i.station ? String(i.station) : undefined,
            notes: i.notes ? String(i.notes) : undefined,
          }))
          .filter((i: any) => i.name)
      : [];

    return this.kitchen.editItems(tenant.id, id, items, {
      priority_flag: body?.priority_flag,
      prep_estimate_minutes: body?.prep_estimate_minutes ?? null,
    });
  }

  @Post('manual')
  @UseGuards(KitchenAccessGuard)
  @ApiBody({ schema: { example: { order_id: 'ord_manual_1', items: [{ name: 'Plantains', qty: 2 }] } } })
  async manual(@CurrentTenant() tenant: TenantContext, @Body() body: any) {
    return this.kitchen.manualCreate(tenant.id, body || {});
  }

  @Post('demo')
  @UseGuards(KitchenAccessGuard)
  async demo(@CurrentTenant() tenant: TenantContext) {
    return this.kitchen.demoSeed(tenant.id);
  }
}
