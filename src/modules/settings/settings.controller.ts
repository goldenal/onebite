import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  async all() {
    return this.settings.getAll();
  }

  @Get('contact')
  async contact() {
    return (await this.settings.getSetting('contact')) || {};
  }

  @Get('hours')
  async hours() {
    return (await this.settings.getSetting('hours')) || {};
  }

  @Get('about')
  async about() {
    return (await this.settings.getSetting('about')) || {};
  }
}
