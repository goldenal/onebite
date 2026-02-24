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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let InventoryService = class InventoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    inventoryStatus(current, min) {
        if (current <= 0)
            return 'out-of-stock';
        if (current <= min)
            return 'low-stock';
        return 'in-stock';
    }
    async list(tenantId) {
        const rows = await this.prisma.inventoryItem.findMany({ where: { tenantId }, orderBy: { itemName: 'asc' } });
        return rows.map((item) => ({
            itemId: item.itemId,
            itemName: item.itemName,
            currentStock: item.currentStock,
            minStock: item.minStock,
            maxStock: item.maxStock,
            unit: item.unit,
            status: this.inventoryStatus(item.currentStock ?? 0, item.minStock ?? 5),
            autoReorder: item.autoReorder === true,
            lastRestocked: item.lastRestocked ? item.lastRestocked.toISOString() : null,
        }));
    }
    async get(tenantId, itemId) {
        const item = await this.prisma.inventoryItem.findFirst({ where: { itemId, tenantId } });
        if (!item)
            throw new common_1.NotFoundException('Inventory item not found');
        return {
            itemId: item.itemId,
            itemName: item.itemName,
            currentStock: item.currentStock,
            minStock: item.minStock,
            maxStock: item.maxStock,
            unit: item.unit,
            status: this.inventoryStatus(item.currentStock ?? 0, item.minStock ?? 5),
            autoReorder: item.autoReorder === true,
            lastRestocked: item.lastRestocked ? item.lastRestocked.toISOString() : null,
        };
    }
    async create(tenantId, dto) {
        const status = this.inventoryStatus(dto.currentStock ?? 0, dto.minStock ?? 5);
        const lastRestocked = new Date();
        await this.prisma.inventoryItem.create({
            data: {
                itemId: dto.itemId,
                tenantId,
                itemName: dto.itemName,
                currentStock: dto.currentStock ?? 0,
                minStock: dto.minStock ?? 5,
                maxStock: dto.maxStock ?? 50,
                unit: dto.unit ?? 'servings',
                status,
                autoReorder: dto.autoReorder ?? false,
                lastRestocked,
            },
        });
        return {
            itemId: dto.itemId,
            itemName: dto.itemName,
            currentStock: dto.currentStock ?? 0,
            minStock: dto.minStock ?? 5,
            maxStock: dto.maxStock ?? 50,
            unit: dto.unit ?? 'servings',
            status,
            autoReorder: dto.autoReorder ?? false,
            lastRestocked: lastRestocked.toISOString(),
        };
    }
    async update(tenantId, itemId, dto) {
        const existing = await this.prisma.inventoryItem.findFirst({ where: { itemId, tenantId } });
        if (!existing)
            throw new common_1.NotFoundException('Inventory item not found');
        const newCurrent = dto.currentStock ?? existing.currentStock ?? 0;
        const newMin = dto.minStock ?? existing.minStock ?? 5;
        const status = this.inventoryStatus(newCurrent, newMin);
        const lastRestocked = dto.currentStock !== undefined && dto.currentStock !== existing.currentStock
            ? new Date()
            : existing.lastRestocked;
        await this.prisma.inventoryItem.updateMany({
            where: { itemId, tenantId },
            data: {
                currentStock: newCurrent,
                minStock: newMin,
                maxStock: dto.maxStock ?? existing.maxStock,
                unit: dto.unit ?? existing.unit,
                status,
                autoReorder: dto.autoReorder !== undefined ? dto.autoReorder : existing.autoReorder,
                lastRestocked,
            },
        });
        return {
            itemId,
            itemName: existing.itemName,
            currentStock: newCurrent,
            minStock: newMin,
            maxStock: dto.maxStock ?? existing.maxStock,
            unit: dto.unit ?? existing.unit,
            status,
            autoReorder: dto.autoReorder !== undefined ? dto.autoReorder : existing.autoReorder,
            lastRestocked: lastRestocked ? new Date(lastRestocked).toISOString() : null,
        };
    }
    async remove(tenantId, itemId) {
        const existing = await this.prisma.inventoryItem.findFirst({ where: { itemId, tenantId } });
        if (!existing)
            throw new common_1.NotFoundException('Inventory item not found');
        await this.prisma.inventoryItem.deleteMany({ where: { itemId, tenantId } });
        return { message: 'Inventory item deleted successfully' };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
