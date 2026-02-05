import { Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { KitchenService } from './kitchen.service';

@ApiTags('arrivals')
@Controller('arrivals')
export class ArrivalsController {
  constructor(private readonly kitchen: KitchenService) {}

  @Post(':orderId')
  async arrive(@Param('orderId') orderId: string) {
    const updated = await this.kitchen.updateArrival(orderId);
    return { arrival_status: updated?.arrival_status, order_id: orderId };
  }
}
