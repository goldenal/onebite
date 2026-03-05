import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { KitchenModule } from '../kitchen/kitchen.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { PlatformModule } from '../platform/platform.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [KitchenModule, DeliveryModule, PlatformModule, NotificationsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
