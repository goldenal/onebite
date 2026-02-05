import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { KitchenModule } from '../kitchen/kitchen.module';

@Module({
  imports: [KitchenModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
