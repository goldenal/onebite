import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { BusinessController } from './business.controller';

@Module({
  controllers: [PlatformController, BusinessController],
  providers: [PlatformService],
  exports: [PlatformService],
})
export class PlatformModule {}
