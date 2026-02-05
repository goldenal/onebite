import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSetting(key: string) {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    return row ? row.value : null;
  }

  async getAll() {
    const [contact, hours, about] = await Promise.all([
      this.getSetting('contact'),
      this.getSetting('hours'),
      this.getSetting('about'),
    ]);
    return { contact, hours, about };
  }
}
