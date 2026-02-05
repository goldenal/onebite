import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { DeliveryRequestDto } from './dto/delivery-request.dto';
import { DeliveryWebhookDto } from './dto/delivery-webhook.dto';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}

  @Post('request')
  async request(@Body() body: DeliveryRequestDto) {
    return this.delivery.request(body);
  }

  @Post('webhook')
  async webhook(@Body() body: DeliveryWebhookDto) {
    return this.delivery.webhook(body);
  }

  @Get(':orderId/status')
  async status(@Param('orderId') orderId: string) {
    return this.delivery.status(orderId);
  }
}
