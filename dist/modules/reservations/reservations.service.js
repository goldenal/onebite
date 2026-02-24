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
exports.ReservationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto_1 = require("crypto");
let ReservationsService = class ReservationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(tenantId) {
        const rows = await this.prisma.reservation.findMany({
            where: { tenantId },
            orderBy: [{ date: 'desc' }, { time: 'desc' }],
        });
        return rows.map((r) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone,
            guests: r.guests,
            date: r.date,
            time: r.time,
            specialRequests: r.specialRequests,
            status: r.status,
            notes: r.notes,
            createdAt: Number(r.createdAt),
        }));
    }
    async get(tenantId, id) {
        const r = await this.prisma.reservation.findFirst({ where: { id, tenantId } });
        if (!r)
            throw new common_1.NotFoundException('Reservation not found');
        return {
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone,
            guests: r.guests,
            date: r.date,
            time: r.time,
            specialRequests: r.specialRequests,
            status: r.status,
            notes: r.notes,
            createdAt: Number(r.createdAt),
        };
    }
    async create(tenantId, dto) {
        const id = (0, crypto_1.randomUUID)();
        const createdAt = BigInt(Date.now());
        const location = await this.prisma.location.findFirst({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
        await this.prisma.reservation.create({
            data: {
                id,
                tenantId,
                locationId: location?.id ?? null,
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                guests: dto.guests,
                date: dto.date,
                time: dto.time,
                specialRequests: dto.specialRequests ?? '',
                status: 'pending',
                createdAt,
            },
        });
        return { id, ...dto, status: 'pending', createdAt: Number(createdAt) };
    }
    async update(tenantId, id, dto) {
        const existing = await this.prisma.reservation.findFirst({ where: { id, tenantId } });
        if (!existing)
            throw new common_1.NotFoundException('Reservation not found');
        const updatedRows = await this.prisma.reservation.updateMany({
            where: { id, tenantId },
            data: {
                status: dto.status ?? existing.status,
                notes: dto.notes ?? existing.notes,
                specialRequests: dto.specialRequests ?? existing.specialRequests,
            },
        });
        if (!updatedRows.count)
            throw new common_1.NotFoundException('Reservation not found');
        const updated = await this.prisma.reservation.findFirst({ where: { id, tenantId } });
        if (!updated)
            throw new common_1.NotFoundException('Reservation not found');
        return {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            guests: updated.guests,
            date: updated.date,
            time: updated.time,
            specialRequests: updated.specialRequests,
            status: updated.status,
            notes: updated.notes,
            createdAt: Number(updated.createdAt),
        };
    }
    async remove(tenantId, id) {
        const existing = await this.prisma.reservation.findFirst({ where: { id, tenantId } });
        if (!existing)
            throw new common_1.NotFoundException('Reservation not found');
        await this.prisma.reservation.deleteMany({ where: { id, tenantId } });
        return { message: 'Reservation deleted successfully' };
    }
};
exports.ReservationsService = ReservationsService;
exports.ReservationsService = ReservationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReservationsService);
