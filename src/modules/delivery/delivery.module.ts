import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { NashService } from './nash.service';

@Module({
  controllers: [DeliveryController],
  providers: [DeliveryService, NashService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
