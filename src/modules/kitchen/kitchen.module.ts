import { Module } from '@nestjs/common';
import { KitchenController } from './kitchen.controller';
import { ArrivalsController } from './arrivals.controller';
import { KitchenService } from './kitchen.service';

@Module({
  controllers: [KitchenController, ArrivalsController],
  providers: [KitchenService],
  exports: [KitchenService],
})
export class KitchenModule {}
