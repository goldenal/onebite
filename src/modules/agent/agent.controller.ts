import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { KitchenService } from '../kitchen/kitchen.service';

@ApiTags('agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly kitchen: KitchenService) {}

  @Post('confirm_payment')
  @UseGuards(AuthGuard)
  async confirmPayment(@Body() body: { cart_id?: string }) {
    const cartId = body?.cart_id;
    if (!cartId) return { error: 'bad_request', message: 'cart_id required' };
    const orderId = `ord_${cartId}`;
    const order = await this.kitchen.getOrder(orderId);
    return { paid: !!order, order_id: order ? order.id : null };
  }

  @Post('generate_pickup_code')
  @UseGuards(AuthGuard)
  async generatePickup(@Body() body: { order_id?: string }) {
    const orderId = body?.order_id;
    if (!orderId) return { error: 'bad_request', message: 'order_id required' };
    return this.kitchen.generatePickup(orderId);
  }
}
