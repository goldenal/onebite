"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SettingsService = class SettingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSetting(tenantId, key) {
        const row = await this.prisma.tenantSetting.findUnique({
            where: {
                tenantId_key: { tenantId, key },
            },
        });
        if (row)
            return row.value;
        const legacy = await this.prisma.setting.findUnique({ where: { key } });
        return legacy ? legacy.value : null;
    }
    async putSetting(tenantId, key, value) {
        const row = await this.prisma.tenantSetting.upsert({
            where: {
                tenantId_key: { tenantId, key },
            },
            update: { value: value, updatedAt: new Date() },
            create: { tenantId, key, value: value, updatedAt: new Date() },
        });
        return row ? row.value : null;
    }
    async getAll(tenantId) {
        const [contact, hours, about] = await Promise.all([
            this.getSetting(tenantId, 'contact'),
            this.getSetting(tenantId, 'hours'),
            this.getSetting(tenantId, 'about'),
        ]);
        return { contact, hours, about };
    }
    async getContent(tenantId, contentType) {
        const content = await this.prisma.tenantContent.findUnique({
            where: { tenantId_contentType: { tenantId, contentType } },
        });
        return content?.content ?? null;
    }
    async putContent(tenantId, contentType, value) {
        const content = await this.prisma.tenantContent.upsert({
            where: { tenantId_contentType: { tenantId, contentType } },
            update: { content: value, updatedAt: new Date() },
            create: {
                id: `${contentType}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                tenantId,
                contentType,
                content: value,
                updatedAt: new Date(),
            },
        });
        return content.content;
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
