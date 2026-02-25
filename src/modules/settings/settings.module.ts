import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { ContentController } from './content.controller';

@Module({
  controllers: [SettingsController, ContentController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
