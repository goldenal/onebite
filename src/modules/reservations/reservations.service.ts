import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) {
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

  async get(tenantId: string, id: string) {
    const r = await this.prisma.reservation.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException('Reservation not found');
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

  async create(tenantId: string, dto: CreateReservationDto) {
    const id = randomUUID();
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

  async update(tenantId: string, id: string, dto: UpdateReservationDto) {
    const existing = await this.prisma.reservation.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Reservation not found');

    const updatedRows = await this.prisma.reservation.updateMany({
      where: { id, tenantId },
      data: {
        status: dto.status ?? existing.status,
        notes: dto.notes ?? existing.notes,
        specialRequests: dto.specialRequests ?? existing.specialRequests,
      },
    });
    if (!updatedRows.count) throw new NotFoundException('Reservation not found');
    const updated = await this.prisma.reservation.findFirst({ where: { id, tenantId } });
    if (!updated) throw new NotFoundException('Reservation not found');

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

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.reservation.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Reservation not found');
    await this.prisma.reservation.deleteMany({ where: { id, tenantId } });
    return { message: 'Reservation deleted successfully' };
  }
}
