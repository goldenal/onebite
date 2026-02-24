import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSetting(tenantId: string, key: string) {
    const row = await this.prisma.tenantSetting.findUnique({
      where: {
        tenantId_key: { tenantId, key },
      },
    });
    if (row) return row.value;

    const legacy = await this.prisma.setting.findUnique({ where: { key } });
    return legacy ? legacy.value : null;
  }

  async putSetting(tenantId: string, key: string, value: unknown) {
    const row = await this.prisma.tenantSetting.upsert({
      where: {
        tenantId_key: { tenantId, key },
      },
      update: { value: value as any, updatedAt: new Date() },
      create: { tenantId, key, value: value as any, updatedAt: new Date() },
    });
    return row ? row.value : null;
  }

  async getAll(tenantId: string) {
    const [contact, hours, about] = await Promise.all([
      this.getSetting(tenantId, 'contact'),
      this.getSetting(tenantId, 'hours'),
      this.getSetting(tenantId, 'about'),
    ]);
    return { contact, hours, about };
  }

  async getContent(tenantId: string, contentType: string) {
    const content = await this.prisma.tenantContent.findUnique({
      where: { tenantId_contentType: { tenantId, contentType } },
    });
    return content?.content ?? null;
  }

  async putContent(tenantId: string, contentType: string, value: unknown) {
    const content = await this.prisma.tenantContent.upsert({
      where: { tenantId_contentType: { tenantId, contentType } },
      update: { content: value as any, updatedAt: new Date() },
      create: {
        id: `${contentType}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        tenantId,
        contentType,
        content: value as any,
        updatedAt: new Date(),
      },
    });
    return content.content;
  }
}
