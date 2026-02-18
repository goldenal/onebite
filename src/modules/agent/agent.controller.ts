import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { KitchenService } from '../kitchen/kitchen.service';

@ApiTags('agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly kitchen: KitchenService) {}

  @Post('confirm_payment')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearer')
  @ApiBody({ schema: { example: { cart_id: 'cart_123' } } })
  async confirmPayment(@Body() body: { cart_id?: string }) {
    const cartId = body?.cart_id;
    if (!cartId) throw new BadRequestException('cart_id_required');
    const orderId = `ord_${cartId}`;
    const order = await this.kitchen.getOrder(orderId);
    return { paid: !!order, order_id: order ? order.id : null };
  }

  @Post('generate_pickup_code')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearer')
  @ApiBody({ schema: { example: { order_id: 'ord_12345' } } })
  async generatePickup(@Body() body: { order_id?: string }) {
    const orderId = body?.order_id;
    if (!orderId) throw new BadRequestException('order_id_required');
    return this.kitchen.generatePickup(orderId);
  }
}
