import { Module } from '@nestjs/common';
import { LegacyOrdersController } from './legacy-orders.controller';
import { LegacyOrdersService } from './legacy-orders.service';

@Module({
  controllers: [LegacyOrdersController],
  providers: [LegacyOrdersService],
})
export class LegacyOrdersModule {}
