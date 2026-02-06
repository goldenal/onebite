import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { KitchenModule } from '../kitchen/kitchen.module';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [KitchenModule, DeliveryModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
