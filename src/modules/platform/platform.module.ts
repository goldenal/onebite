import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { BusinessController } from './business.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PlatformController, BusinessController],
  providers: [PlatformService],
  exports: [PlatformService],
})
export class PlatformModule {}
