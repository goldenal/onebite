import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { KitchenService } from './kitchen.service';
import { KitchenAccessGuard } from '../auth/auth.guard';

@ApiTags('kitchen')
@ApiBearerAuth('bearer')
@Controller('kitchen')
export class KitchenController {
  constructor(private readonly kitchen: KitchenService) {}

  @Get('stream')
  @UseGuards(KitchenAccessGuard)
  async stream(@Req() req: Request, @Res() res: Response) {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.flushHeaders();
    res.write('retry: 5000\n\n');
    const { streamHub } = await import('../../common/stream/stream-hub');
    const clientId = streamHub.register(res);

    const interval = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(interval);
      streamHub.unregister(clientId);
    });
  }

  @Get('orders/:id/stream')
  async streamOrder(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.flushHeaders();
    res.write('retry: 5000\n\n');

    const { streamHub } = await import('../../common/stream/stream-hub');
    const clientId = streamHub.register(
      res,
      (message) => {
        const order = message.order as any;
        const orderId = (message.order_id as string | undefined) || (message.orderId as string | undefined);
        return order?.id === id || orderId === id;
      },
      (message) => {
        const order = message.order as any;
        if (order?.id === id) {
          return {
            type: 'order.status',
            order_id: order.id,
            status: order.status,
            arrival_status: order.arrival_status,
            fulfillment: order.fulfillment,
            channel: order.channel,
          };
        }
        if ((message.order_id as string | undefined) === id) {
          const status = (message as any).status;
          const arrival = (message as any).arrival_status;
          if (status || arrival) {
            return {
              type: 'order.status',
              order_id: id,
              status,
              arrival_status: arrival,
            };
          }
        }
        return null;
      },
    );

    const current = await this.kitchen.getOrder(id);
    if (current) {
      res.write(
        `data: ${JSON.stringify({
          type: 'order.status',
          order_id: current.id,
          status: current.status,
          arrival_status: current.arrival_status,
          fulfillment: current.fulfillment,
          channel: current.channel,
        })}\n\n`,
      );
    }

    const interval = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(interval);
      streamHub.unregister(clientId);
    });
  }

  @Get('orders')
  @UseGuards(KitchenAccessGuard)
  async list(@Query('status') status?: string, @Query('channel') channel?: string, @Query('fulfillment') fulfillment?: string) {
    const orders = await this.kitchen.listOrders({
      status: status as any,
      channel: channel as any,
      fulfillment: fulfillment as any,
    });
    return { orders };
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    return this.kitchen.getOrder(id);
  }

  @Post('orders/:id/start')
  @UseGuards(KitchenAccessGuard)
  async start(@Param('id') id: string) {
    return this.kitchen.updateStatus(id, 'in_prep');
  }

  @Post('orders/:id/ready')
  @UseGuards(KitchenAccessGuard)
  async ready(@Param('id') id: string) {
    return this.kitchen.updateStatus(id, 'ready_waiting_arrival');
  }

  @Post('orders/:id/serve')
  @UseGuards(KitchenAccessGuard)
  async serve(@Param('id') id: string) {
    return this.kitchen.updateStatus(id, 'served');
  }

  @Post('orders/:id/deliver')
  @UseGuards(KitchenAccessGuard)
  async deliver(@Param('id') id: string) {
    return this.kitchen.updateStatus(id, 'delivered');
  }

  @Post('orders/:id/hold')
  @UseGuards(KitchenAccessGuard)
  async hold(@Param('id') id: string) {
    return this.kitchen.updateStatus(id, 'on_hold');
  }

  @Post('orders/:id/resume')
  @UseGuards(KitchenAccessGuard)
  async resume(@Param('id') id: string) {
    return this.kitchen.updateStatus(id, 'in_prep');
  }

  @Post('orders/:id/cancel')
  @UseGuards(KitchenAccessGuard)
  async cancel(@Param('id') id: string) {
    return this.kitchen.updateStatus(id, 'canceled');
  }

  @Post('orders/:id/arrive')
  @UseGuards(KitchenAccessGuard)
  async arrive(@Param('id') id: string) {
    return this.kitchen.updateArrival(id);
  }

  @Post('orders/:id/refire')
  @UseGuards(KitchenAccessGuard)
  @ApiBody({ schema: { example: { items: ['item_1'], reason: 'Overcooked' } } })
  async refire(@Param('id') id: string, @Body() body: { items?: string[]; reason?: string }) {
    return this.kitchen.refire(id, body?.items, body?.reason);
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

    return this.kitchen.editItems(id, items, {
      priority_flag: body?.priority_flag,
      prep_estimate_minutes: body?.prep_estimate_minutes ?? null,
    });
  }

  @Post('manual')
  @UseGuards(KitchenAccessGuard)
  @ApiBody({ schema: { example: { order_id: 'ord_manual_1', items: [{ name: 'Plantains', qty: 2 }] } } })
  async manual(@Body() body: any) {
    return this.kitchen.manualCreate(body || {});
  }

  @Post('demo')
  @UseGuards(KitchenAccessGuard)
  async demo() {
    return this.kitchen.demoSeed();
  }
}
