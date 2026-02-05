import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CartCreateDto } from './dto/cart-create.dto';
import { PaymentLinkDto } from './dto/payment-link.dto';
import { PhonePaymentLinkDto } from './dto/phone-payment-link.dto';

@ApiTags('payments')
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('cart/create')
  async createCart(@Body() body: CartCreateDto) {
    return this.payments.createCart(body);
  }

  @Post('payments/link')
  async paymentLink(@Body() body: PaymentLinkDto) {
    return this.payments.createPaymentLink(body);
  }

  @Get('payments/:orderId')
  async getPayment(@Param('orderId') orderId: string) {
    return this.payments.getPayment(orderId);
  }

  @Post('phone/payment-link')
  async phonePaymentLink(@Body() body: PhonePaymentLinkDto) {
    return this.payments.phonePaymentLink(body);
  }
}
