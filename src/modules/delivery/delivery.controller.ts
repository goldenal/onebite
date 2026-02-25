import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { DeliveryRequestDto } from './dto/delivery-request.dto';
import { DeliveryQuoteDto } from './dto/delivery-quote.dto';
import { DeliveryWebhookDto } from './dto/delivery-webhook.dto';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import type { TenantContext } from '../../common/tenant/tenant.types';

@ApiTags('delivery')
@Controller('delivery')
@UseGuards(TenantRequiredGuard)
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}

  @Post('request')
  async request(@CurrentTenant() tenant: TenantContext, @Body() body: DeliveryRequestDto) {
    return this.delivery.request(tenant.id, body);
  }

  @Post('quote')
  async quote(@CurrentTenant() tenant: TenantContext, @Body() body: DeliveryQuoteDto) {
    return this.delivery.quote(tenant.id, body);
  }

  @Post('webhook')
  async webhook(@CurrentTenant() tenant: TenantContext, @Body() body: DeliveryWebhookDto) {
    return this.delivery.webhook(tenant.id, body);
  }

  @Get(':orderId/status')
  async status(@CurrentTenant() tenant: TenantContext, @Param('orderId') orderId: string) {
    return this.delivery.status(tenant.id, orderId);
  }
}
