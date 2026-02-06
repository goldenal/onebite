import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { UberDirectService } from './uber-direct.service';

@Module({
  controllers: [DeliveryController],
  providers: [DeliveryService, UberDirectService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
