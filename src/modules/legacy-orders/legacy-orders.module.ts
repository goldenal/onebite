import { Module } from '@nestjs/common';
import { LegacyOrdersController } from './legacy-orders.controller';
import { LegacyOrdersService } from './legacy-orders.service';
import { OrderTrackingController } from './order-tracking.controller';

@Module({
  controllers: [LegacyOrdersController, OrderTrackingController],
  providers: [LegacyOrdersService],
})
export class LegacyOrdersModule {}
